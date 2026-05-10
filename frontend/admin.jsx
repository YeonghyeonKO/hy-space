// Admin layout editor + simpler users/stats screens.

function AdminLayoutScreen({ floor, floorMeta, onSave }) {
  const [tool, setTool] = useState('select'); // select | seat | room | zone | erase
  const [seats, setSeats] = useState(floor.seats);
  const [rooms, setRooms] = useState(floor.rooms);
  const [zones, setZones] = useState(floor.zones);
  const [selected, setSelected] = useState(null); // { kind, id }
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [draft, setDraft] = useState(null); // for drag-drawing rooms
  // Background reference image (uploaded floor plan)
  const [bgImage, setBgImage] = useState(null); // { src, w, h, opacity, x, y }
  const [bgOpacity, setBgOpacity] = useState(0.45);
  const [bgLocked, setBgLocked] = useState(true);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const fileInputRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => { setSeats(floor.seats); setRooms(floor.rooms); setZones(floor.zones); setSelected(null); }, [floor.id]);

  const onUploadBg = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      const img = new Image();
      img.onload = () => {
        // Fit image into 1200x720 viewBox preserving aspect.
        const viewW = 1200, viewH = 720;
        const ratio = Math.min(viewW / img.width, viewH / img.height) * 0.92;
        const w = img.width * ratio;
        const h = img.height * ratio;
        setBgImage({ src, w, h, x: (viewW - w) / 2, y: (viewH - h) / 2, natW: img.width, natH: img.height });
        setShowImportPanel(true);
        setBgLocked(true);
        onSave('도면 이미지가 업로드되었습니다. 좌석을 그 위에 배치해보세요');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const autoDetectSeats = () => {
    if (!bgImage) return;
    // Heuristic placeholder: scatter ~14 seats over the bg area in a believable cluster pattern
    const sample = [
      // top desks (4 desks × 2 seats each)
      ...[0, 1, 2, 3].flatMap((i) => [
        { x: bgImage.x + 80 + i * 130, y: bgImage.y + 60 },
        { x: bgImage.x + 80 + i * 130, y: bgImage.y + 100 },
      ]),
      // diamond cluster row (4 × 4 seats)
      ...[0, 1, 2, 3].flatMap((i) => {
        const cx = bgImage.x + 110 + i * 130, cy = bgImage.y + 230;
        return [
          { x: cx, y: cy - 35 }, { x: cx, y: cy + 25 },
          { x: cx - 36, y: cy - 5 }, { x: cx + 36, y: cy - 5 },
        ];
      }),
      // round tables (3+4)
      ...[0, 1, 2].flatMap((i) => {
        const cx = bgImage.x + 380 + i * 110, cy = bgImage.y + 460;
        return [
          { x: cx - 30, y: cy }, { x: cx + 30, y: cy },
          { x: cx, y: cy - 30 }, { x: cx, y: cy + 30 },
        ];
      }),
      ...[0, 1, 2, 3].flatMap((i) => {
        const cx = bgImage.x + 320 + i * 110, cy = bgImage.y + 580;
        return [
          { x: cx - 30, y: cy }, { x: cx + 30, y: cy },
          { x: cx, y: cy - 30 }, { x: cx, y: cy + 30 },
        ];
      }),
    ];
    const newSeats = sample.map((s, i) => ({
      id: `AUTO-${i + 1}`,
      label: `S${(i + 1).toString().padStart(2, '0')}`,
      x: s.x - 18, y: s.y - 16, w: 36, h: 32,
      status: 'available', facing: 'up',
    }));
    setSeats((prev) => [...prev, ...newSeats]);
    onSave(`${newSeats.length}개 좌석이 자동 배치되었습니다 (확인 후 조정하세요)`);
  };

  const onBgFile = (e) => {
    const f = e.target.files?.[0];
    if (f) onUploadBg(f);
    e.target.value = '';
  };

  const onCanvasDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f && /^image\//.test(f.type)) onUploadBg(f);
  };

  const toSvgCoords = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM().inverse();
    const p = pt.matrixTransform(ctm);
    if (showGrid) { p.x = Math.round(p.x / 10) * 10; p.y = Math.round(p.y / 10) * 10; }
    return { x: p.x, y: p.y };
  };

  const onCanvasDown = (e) => {
    const p = toSvgCoords(e);
    if (tool === 'seat') {
      const id = `S-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      setSeats((s) => [...s, { id, label: id.slice(2), x: p.x - 18, y: p.y - 16, w: 36, h: 32, status: 'available', facing: 'up' }]);
      setSelected({ kind: 'seat', id });
    } else if (tool === 'room' || tool === 'zone') {
      setDraft({ kind: tool, x: p.x, y: p.y, w: 0, h: 0 });
      const move = (ev) => {
        const q = toSvgCoords(ev);
        setDraft((d) => d && { ...d, w: q.x - d.x, h: q.y - d.y });
      };
      const up = (ev) => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        setDraft((d) => {
          if (!d) return null;
          let { x, y, w, h } = d;
          if (w < 0) { x += w; w = -w; }
          if (h < 0) { y += h; h = -h; }
          if (w > 20 && h > 20) {
            if (tool === 'room') {
              const id = `R-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
              setRooms((r) => [...r, { id, name: '새 회의실', capacity: 6, x, y, w, h, kind: 'medium', amenities: [] }]);
              setSelected({ kind: 'room', id });
            } else {
              const id = `Z-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
              setZones((z) => [...z, { id, kind: 'pantry', x, y, w, h, label: '구획' }]);
              setSelected({ kind: 'zone', id });
            }
          }
          return null;
        });
        setTool('select');
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    } else if (tool === 'select') {
      setSelected(null);
    }
  };

  const dragSelected = (e, item, kind) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    setSelected({ kind, id: item.id });
    const start = toSvgCoords(e);
    const orig = { x: item.x, y: item.y };
    const move = (ev) => {
      const q = toSvgCoords(ev);
      const dx = q.x - start.x, dy = q.y - start.y;
      const updater = (arr) => arr.map((i) => i.id === item.id ? { ...i, x: orig.x + dx, y: orig.y + dy } : i);
      if (kind === 'seat') setSeats(updater);
      else if (kind === 'room') setRooms(updater);
      else if (kind === 'zone') setZones(updater);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const sel = selected
    ? (selected.kind === 'seat' ? seats.find((s) => s.id === selected.id)
       : selected.kind === 'room' ? rooms.find((r) => r.id === selected.id)
       : zones.find((z) => z.id === selected.id))
    : null;

  const updateSelected = (patch) => {
    if (!selected) return;
    const updater = (arr) => arr.map((i) => i.id === selected.id ? { ...i, ...patch } : i);
    if (selected.kind === 'seat') setSeats(updater);
    else if (selected.kind === 'room') setRooms(updater);
    else if (selected.kind === 'zone') setZones(updater);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const updater = (arr) => arr.filter((i) => i.id !== selected.id);
    if (selected.kind === 'seat') setSeats(updater);
    else if (selected.kind === 'room') setRooms(updater);
    else if (selected.kind === 'zone') setZones(updater);
    setSelected(null);
  };

  const tools = [
    ['select', '선택', <I.Move size={15} />],
    ['seat', '좌석', <I.Seat size={15} />],
    ['room', '회의실', <I.Room size={15} />],
    ['zone', '구획', <I.Grid size={15} />],
  ];

  const bgImageNode = bgImage && (
    <g style={{ pointerEvents: bgLocked ? 'none' : 'auto', opacity: bgOpacity }}>
      <image href={bgImage.src} x={bgImage.x} y={bgImage.y} width={bgImage.w} height={bgImage.h}
             preserveAspectRatio="xMidYMid meet" />
    </g>
  );

  return (
    <div className="row" style={{ gap: 14, alignItems: 'stretch', minHeight: 'calc(100vh - 200px)' }}>
      {/* Left tool palette */}
      <div className="card" style={{ width: 60, padding: 8, display: 'flex', flexDirection: 'column', gap: 4, alignSelf: 'flex-start', position: 'sticky', top: 'calc(var(--header-h) + var(--sub-h) + 14px)' }}>
        {tools.map(([id, label, icon]) => (
          <button key={id} onClick={() => setTool(id)} title={label}
            style={{
              width: 44, height: 44, borderRadius: 8,
              background: tool === id ? 'var(--primary)' : 'transparent',
              color: tool === id ? '#fff' : 'var(--text-2)',
              border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer',
              gap: 2,
            }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {icon}
              <span style={{ fontSize: 9.5, fontWeight: 500 }}>{label}</span>
            </div>
          </button>
        ))}
        <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />
        <button onClick={deleteSelected} disabled={!selected} title="삭제"
          style={{ width: 44, height: 44, borderRadius: 8, background: 'transparent',
            color: selected ? 'var(--danger)' : 'var(--text-3)',
            border: 0, display: 'grid', placeItems: 'center', cursor: selected ? 'pointer' : 'not-allowed' }}>
          <I.Trash size={15} />
        </button>
      </div>

      {/* Canvas */}
      <div className="card grow" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="row" style={{
          padding: '10px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)',
          gap: 8,
        }}>
          <div className="row" style={{ gap: 6 }}>
            <span className="pill" data-color="primary"><I.Edit size={12} /> 편집 중</span>
            <span className="small muted">{floor.name}</span>
          </div>
          <div className="grow" />
          <div className="row" style={{ gap: 6 }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onBgFile} style={{ display: 'none' }} />
            <button className="btn btn-sm"
                    style={bgImage ? { background: 'var(--primary-soft)', borderColor: 'var(--primary)', color: 'var(--primary-text)' } : {}}
                    onClick={() => bgImage ? setShowImportPanel(!showImportPanel) : fileInputRef.current?.click()}>
              <I.Plus size={12} /> {bgImage ? '도면 옵션' : '도면 업로드'}
            </button>

            <button className="btn btn-sm" onClick={() => setZoom((z) => Math.max(.5, z - .1))}>−</button>
            <span className="small mono" style={{ width: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn btn-sm" onClick={() => setZoom((z) => Math.min(2, z + .1))}>+</button>
            <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
            <button className="btn btn-sm">취소</button>
            <button className="btn btn-sm btn-primary" onClick={async () => {
              if (window.HySpaceAPI) {
                await HySpaceAPI.saveLayout(floor.id, {
                  seats: seats.map(s => ({ label: s.label, x: s.x, y: s.y, w: s.w, h: s.h, facing: s.facing || 'up', group_name: s.group_name || null })),
                  rooms: rooms.map(r => ({ name: r.name, capacity: r.capacity, x: r.x, y: r.y, w: r.w, h: r.h, kind: r.kind, amenities: r.amenities || [] })),
                  zones: zones.map(z => ({ kind: z.kind, label: z.label, x: z.x, y: z.y, w: z.w, h: z.h })),
                });
              }
              onSave('Layout 변경사항이 저장되었습니다');
            }}>
              <I.Check size={12} /> 저장
            </button>
          </div>
        </div>
        <div style={{
          flex: 1, overflow: 'auto', padding: 14,
          background: showGrid
            ? 'var(--bg) repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 20px), repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 20px)'
            : 'var(--bg)',
          backgroundSize: showGrid ? '20px 20px' : 'auto',
        }}>
          <svg ref={svgRef} viewBox={floor.viewBox}
               onMouseDown={onCanvasDown}
               onDragOver={(e) => e.preventDefault()}
               onDrop={onCanvasDrop}
               style={{
                 width: 1200 * zoom, height: 720 * zoom, maxWidth: 'none',
                 cursor: tool === 'select' ? 'default' : 'crosshair',
                 background: 'var(--surface)', borderRadius: 8,
                 boxShadow: 'var(--shadow)',
               }}>
            <defs>
              <pattern id="hatch-a" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-strong)" strokeWidth="1" />
              </pattern>
              <pattern id="dots-a" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="var(--line-strong)" />
              </pattern>
            </defs>
            <rect x={0} y={0} width={1200} height={720} fill="var(--surface)" />
            {bgImageNode}
            {floor.walls.map((w, i) => (
              <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h}
                    fill="none" stroke="var(--line-strong)" strokeWidth={1.5} rx={4} />
            ))}
            {/* Zones */}
            {zones.map((z) => {
              const fill = z.kind === 'core' ? 'url(#hatch-a)'
                : z.kind === 'lounge' ? 'url(#dots-a)' : 'var(--surface-2)';
              const isSel = selected?.kind === 'zone' && selected.id === z.id;
              return (
                <g key={z.id || z.label} onMouseDown={(e) => dragSelected(e, z, 'zone')}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={fill}
                        stroke={isSel ? 'var(--primary)' : 'var(--line)'}
                        strokeWidth={isSel ? 1.5 : .8}
                        strokeDasharray={isSel ? '4 3' : null} rx={4} />
                  <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle"
                        fontSize={11} fill="var(--text-3)" fontWeight={500}>{z.label}</text>
                </g>
              );
            })}
            {/* Rooms */}
            {rooms.map((r) => {
              const isSel = selected?.kind === 'room' && selected.id === r.id;
              return (
                <g key={r.id} onMouseDown={(e) => dragSelected(e, r, 'room')}>
                  <rect x={r.x} y={r.y} width={r.w} height={r.h}
                        fill="var(--surface-2)"
                        stroke={isSel ? 'var(--primary)' : 'var(--line-strong)'}
                        strokeWidth={isSel ? 1.5 : 1}
                        strokeDasharray={isSel ? '4 3' : null} rx={4} />
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 4} textAnchor="middle"
                        fontSize={r.kind === 'booth' ? 9 : 12} fill="var(--text)" fontWeight={600}>
                    {r.name}
                  </text>
                  {r.kind !== 'booth' && (
                    <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 12} textAnchor="middle"
                          fontSize={10} fill="var(--text-3)"
                          style={{ fontFamily: 'var(--font-mono)' }}>{r.capacity}인</text>
                  )}
                </g>
              );
            })}
            {/* Seats */}
            {seats.map((s) => {
              const isSel = selected?.kind === 'seat' && selected.id === s.id;
              return (
                <g key={s.id} onMouseDown={(e) => dragSelected(e, s, 'seat')}>
                  <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={5}
                        fill={isSel ? 'var(--primary-soft)' : 'var(--surface)'}
                        stroke={isSel ? 'var(--primary)' : 'var(--line-strong)'}
                        strokeWidth={isSel ? 1.5 : 1}
                        strokeDasharray={isSel ? '3 2' : null} />
                  <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 3}
                        textAnchor="middle" fontSize={9}
                        fill={isSel ? 'var(--primary-text)' : 'var(--text-3)'}
                        style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                    {s.label}
                  </text>
                </g>
              );
            })}
            {/* Draft */}
            {draft && (() => {
              let { x, y, w, h, kind } = draft;
              if (w < 0) { x += w; w = -w; }
              if (h < 0) { y += h; h = -h; }
              return (
                <rect x={x} y={y} width={w} height={h}
                      fill={kind === 'room' ? 'var(--primary-soft)' : 'var(--bg)'}
                      stroke="var(--primary)" strokeWidth={1.2} strokeDasharray="4 3" rx={4} />
              );
            })()}
          </svg>
        </div>
        <div className="row" style={{
          padding: '10px 16px', borderTop: '1px solid var(--line)',
          background: 'var(--surface)', gap: 14,
        }}>
          <span className="small muted">좌석 <span className="mono">{seats.length}</span></span>
          <span className="small muted">회의실 <span className="mono">{rooms.length}</span></span>
          <span className="small muted">구획 <span className="mono">{zones.length}</span></span>
          <div className="grow" />
          <span className="small muted">
            {tool === 'select' ? '드래그로 이동, 클릭으로 선택' :
             tool === 'seat' ? '클릭으로 좌석 추가' :
             tool === 'room' ? '드래그로 회의실 영역을 그리세요' :
             tool === 'zone' ? '드래그로 구획을 그리세요' : ''}
          </span>
        </div>
      </div>

      {/* Right properties panel */}
      <aside className="card" style={{ width: 280, padding: 16, alignSelf: 'flex-start',
        position: 'sticky', top: 'calc(var(--header-h) + var(--sub-h) + 14px)',
      }}>
        <div className="h3" style={{ marginBottom: 12 }}>속성</div>
        {showImportPanel && bgImage && (
          <div className="col fadein" style={{
            gap: 10, marginBottom: 14, padding: 12,
            background: 'var(--primary-soft)', borderRadius: 8,
          }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="smaller" style={{ fontWeight: 600, color: 'var(--primary-text)' }}>도면 참조 이미지</span>
              <button className="topbar-icon-btn" style={{ width: 22, height: 22, color: 'var(--primary-text)' }}
                      onClick={() => setShowImportPanel(false)}><I.X size={12} /></button>
            </div>
            <div className="smaller" style={{ color: 'var(--primary-text)', opacity: .85 }}>
              {bgImage.natW} × {bgImage.natH}px · 이미지 위에 좌석/회의실을 배치하세요
            </div>
            <div className="col" style={{ gap: 4 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="smaller" style={{ color: 'var(--primary-text)' }}>투명도</span>
                <span className="smaller mono" style={{ color: 'var(--primary-text)' }}>{Math.round(bgOpacity * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={bgOpacity}
                     onChange={(e) => setBgOpacity(Number(e.target.value))}
                     style={{ width: '100%' }} />
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn-sm grow" onClick={() => setBgLocked(!bgLocked)}>
                <I.Lock size={11} /> {bgLocked ? '잠김' : '이동 가능'}
              </button>
              <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
                교체
              </button>
              <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                      onClick={() => { setBgImage(null); setShowImportPanel(false); }}>
                <I.Trash size={11} />
              </button>
            </div>
            <button className="btn btn-sm btn-primary" onClick={autoDetectSeats}>
              <I.Pin size={12} /> 자동 좌석 인식 (베타)
            </button>
            <div className="smaller" style={{ color: 'var(--primary-text)', opacity: .7, lineHeight: 1.5 }}>
              인식된 좌석은 이미지 기반 추정값입니다. 위치/라벨을 확인하고 조정하세요.
            </div>
          </div>
        )}
        {!sel && !showImportPanel && (
          <div className="muted small">
            {!bgImage ? (
              <div className="col" style={{ gap: 10, marginBottom: 14 }}>
                <button className="btn" style={{ width: '100%', justifyContent: 'center', height: 80, flexDirection: 'column', gap: 4, borderStyle: 'dashed' }}
                        onClick={() => fileInputRef.current?.click()}>
                  <I.Plus size={16} />
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>도면 이미지 업로드</span>
                  <span className="smaller muted">PNG · JPG · 캔버스에 드래그도 가능</span>
                </button>
              </div>
            ) : null}
            요소를 선택하면 여기에 속성이 표시됩니다.
            <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
              <div className="smaller" style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>도구 안내</div>
              <div className="smaller" style={{ lineHeight: 1.7 }}>
                <strong>도면 업로드</strong> — 기존 좌석배치도 PNG/JPG를 배경으로<br />
                <strong>선택</strong> — 요소 이동·편집<br />
                <strong>좌석</strong> — 클릭하여 좌석 1개 추가<br />
                <strong>회의실</strong> — 드래그하여 영역 생성<br />
                <strong>구획</strong> — 코어/라운지/팬트리 영역
              </div>
            </div>
          </div>
        )}
        {sel && selected.kind === 'seat' && (
          <div className="col" style={{ gap: 10 }}>
            <div className="field">
              <label className="field-label">좌석 ID</label>
              <input className="input mono" value={sel.label} onChange={(e) => updateSelected({ label: e.target.value })} />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <div className="field grow">
                <label className="field-label">X</label>
                <input className="input mono" type="number" value={Math.round(sel.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })} />
              </div>
              <div className="field grow">
                <label className="field-label">Y</label>
                <input className="input mono" type="number" value={Math.round(sel.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })} />
              </div>
            </div>
            <div className="field">
              <label className="field-label">방향</label>
              <select className="select" value={sel.facing || 'up'} onChange={(e) => updateSelected({ facing: e.target.value })}>
                <option value="up">위쪽</option>
                <option value="down">아래쪽</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">소속 그룹</label>
              <select className="select" defaultValue="ai-platform">
                <option value="ai-platform">AI Platform</option>
                <option>DevOps</option>
                <option>Memory Architecture</option>
                <option>공용</option>
              </select>
            </div>
          </div>
        )}
        {sel && selected.kind === 'room' && (
          <div className="col" style={{ gap: 10 }}>
            <div className="field">
              <label className="field-label">회의실 이름</label>
              <input className="input" value={sel.name} onChange={(e) => updateSelected({ name: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">수용 인원</label>
              <input className="input mono" type="number" value={sel.capacity} onChange={(e) => updateSelected({ capacity: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label className="field-label">유형</label>
              <select className="select" value={sel.kind || 'medium'} onChange={(e) => updateSelected({ kind: e.target.value })}>
                <option value="small">소형 (1–4인)</option>
                <option value="medium">중형 (5–8인)</option>
                <option value="large">대형 (9인+)</option>
                <option value="booth">폰부스</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">장비</label>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                {['화면', '화상회의', 'TV', '화이트보드'].map((a) => {
                  const on = (sel.amenities || []).includes(a);
                  return (
                    <button key={a} className="btn btn-sm"
                      style={on ? { background: 'var(--primary-soft)', borderColor: 'var(--primary)', color: 'var(--primary-text)' } : {}}
                      onClick={() => updateSelected({
                        amenities: on ? sel.amenities.filter((x) => x !== a) : [...(sel.amenities || []), a]
                      })}>
                      {on && <I.Check size={11} />} {a}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {sel && selected.kind === 'zone' && (
          <div className="col" style={{ gap: 10 }}>
            <div className="field">
              <label className="field-label">구획 라벨</label>
              <input className="input" value={sel.label} onChange={(e) => updateSelected({ label: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">유형</label>
              <select className="select" value={sel.kind} onChange={(e) => updateSelected({ kind: e.target.value })}>
                <option value="core">코어 (엘리베이터/화장실)</option>
                <option value="pantry">팬트리</option>
                <option value="lounge">라운지</option>
                <option value="reception">리셉션</option>
              </select>
            </div>
          </div>
        )}
        {sel && (
          <button className="btn" style={{ marginTop: 12, color: 'var(--danger)', width: '100%', justifyContent: 'center' }}
                  onClick={deleteSelected}>
            <I.Trash size={13} /> 삭제
          </button>
        )}
      </aside>
    </div>
  );
}

// ── Users ────────────────────────────────────────────────────────────
function AdminUsersScreen() {
  const rules = [
    { aff: 'SK하이닉스', floors: ['5F', '12F', '13F', '14F', '15F'], view: '전체', users: 1340, color: '#2A5BD7' },
    { aff: 'SK AX',     floors: ['8F', '9F', '10F', '11F'], view: '전체', users: 480, color: '#7A5AE0' },
    { aff: '협력사',    floors: [], view: '전체', users: 86, color: '#8B92A0' },
  ];
  return (
    <div className="col" style={{ gap: 14, maxWidth: 980, margin: '0 auto', width: '100%' }}>
      <div className="card card-pad">
        <div className="h3" style={{ marginBottom: 4 }}>소속별 예약 권한</div>
        <div className="muted small">소속에 따라 예약 가능한 층이 자동으로 적용됩니다. 모든 층은 조회 가능합니다.</div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 80px',
          padding: '10px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--line)',
          fontSize: 12, color: 'var(--text-2)', fontWeight: 600,
        }}>
          <div>소속</div><div>예약 가능 층</div><div>조회</div><div>인원</div><div></div>
        </div>
        {rules.map((r) => (
          <div key={r.aff} style={{
            display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 80px',
            padding: '14px 16px', borderBottom: '1px solid var(--line)', alignItems: 'center',
          }}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: r.color }} />
              <span style={{ fontWeight: 600 }}>{r.aff}</span>
            </div>
            <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
              {r.floors.length ? r.floors.map((f) => (
                <span key={f} className="pill" style={{ background: r.color + '20', color: r.color, borderColor: 'transparent', height: 22, fontSize: 11 }}>{f}</span>
              )) : <span className="muted small">예약 불가 (조회 전용)</span>}
            </div>
            <div className="small">{r.view}</div>
            <div className="mono small">{r.users.toLocaleString()}명</div>
            <div><button className="btn btn-sm">편집</button></div>
          </div>
        ))}
      </div>
      <div className="card card-pad">
        <div className="h3" style={{ marginBottom: 12 }}>최근 사용자 활동</div>
        <div className="col" style={{ gap: 8 }}>
          {[
            { who: '박서연', what: '13F · A-04 좌석 예약', when: '5분 전', aff: 'SK하이닉스' },
            { who: '이도윤', what: '13F · Alpha 회의실 예약 (14:00–15:30)', when: '12분 전', aff: 'SK하이닉스' },
            { who: '정하늘', what: '9F · B-07 좌석 예약', when: '34분 전', aff: 'SK AX' },
            { who: '한서영', what: '13F · D-03 좌석 취소', when: '1시간 전', aff: 'SK하이닉스' },
          ].map((a, i) => (
            <div key={i} className="row" style={{
              padding: '8px 10px', borderRadius: 6, background: 'var(--surface-2)', gap: 10,
            }}>
              <div className="avatar" style={{ width: 26, height: 26, fontSize: 11, background: window.HS_AFFILIATIONS[a.aff].color }}>{a.who[0]}</div>
              <div className="col" style={{ gap: 0, minWidth: 0 }}>
                <div className="small"><strong>{a.who}</strong> <span className="muted">· {a.aff}</span></div>
                <div className="smaller muted truncate">{a.what}</div>
              </div>
              <div className="grow" />
              <div className="smaller muted">{a.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────────────────
function AdminStatsScreen({ floor }) {
  const occ = floor.seats.filter((s) => s.status !== 'available').length / floor.seats.length;
  const hours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
  const byHour = [42, 68, 78, 35, 64, 88, 92, 84, 70, 38];
  const peak = Math.max(...byHour);
  return (
    <div className="col" style={{ gap: 14, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="13F 점유율" value={`${Math.round(occ * 100)}%`} accent="primary" />
        <StatCard label="평균 점유율 (이번 주)" value="64%" />
        <StatCard label="회의실 사용 시간" value="187h" />
        <StatCard label="No-show" value="4.2%" accent="ok" />
      </div>
      <div className="card card-pad">
        <div className="row" style={{ marginBottom: 14 }}>
          <div className="h3">시간대별 점유율 (오늘)</div>
          <div className="grow" />
          <span className="small muted">분당 두산타워 13F</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180 }}>
          {byHour.map((v, i) => (
            <div key={i} className="col" style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <div className="mono smaller muted">{v}%</div>
              <div style={{
                width: '100%', height: `${(v / 100) * 140}px`,
                background: v === peak ? 'var(--primary)' : 'var(--primary-soft)',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
              }} />
              <div className="mono smaller muted">{hours[i]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="row" style={{ gap: 14 }}>
        <div className="card card-pad grow">
          <div className="h3" style={{ marginBottom: 12 }}>가장 많이 예약된 회의실</div>
          {[
            ['Alpha', 38, 100], ['Delta', 31, 100], ['Beta', 24, 100], ['Zeta', 19, 100], ['Gamma', 12, 100],
          ].map(([name, v, max]) => (
            <div key={name} className="col" style={{ gap: 4, marginBottom: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="small">{name}</span>
                <span className="small mono muted">{v}회</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card card-pad grow">
          <div className="h3" style={{ marginBottom: 12 }}>층별 점유율</div>
          {[
            ['13F · AI Platform', 78, 'SK하이닉스'],
            ['14F · DRAM Design', 64, 'SK하이닉스'],
            ['12F · Memory Arch', 71, 'SK하이닉스'],
            ['9F · Data & ML', 58, 'SK AX'],
            ['10F · Solution Sales', 42, 'SK AX'],
          ].map(([name, v, aff]) => {
            const c = window.HS_AFFILIATIONS[aff].color;
            return (
              <div key={name} className="col" style={{ gap: 4, marginBottom: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">{name}</span>
                  <span className="small mono muted">{v}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                  <div style={{ width: `${v}%`, height: '100%', background: c, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.AdminLayoutScreen = AdminLayoutScreen;
window.AdminUsersScreen = AdminUsersScreen;
window.AdminStatsScreen = AdminStatsScreen;
