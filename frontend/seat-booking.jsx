// Seat booking screen — floor map (SVG) + booking UX (modal/panel/quick).

function SeatStatusLegend() {
  const items = [
  { color: 'var(--surface)', border: 'var(--line-strong)', label: '예약 가능' },
  { color: 'var(--my-soft)', border: 'var(--my)', label: '내 좌석', strong: true },
  { color: 'var(--surface-2)', border: 'var(--line)', label: '예약됨', filled: true },
  { color: 'transparent', border: 'var(--line)', label: '예약 불가', stripe: true }];

  return (
    <div className="row" style={{ gap: 14, fontSize: 12, color: 'var(--text-2)' }}>
      {items.map((it, i) =>
      <span key={i} className="row" style={{ gap: 6 }}>
          <span style={{
          width: 14, height: 12, borderRadius: 3,
          background: it.stripe ?
          'repeating-linear-gradient(45deg, var(--bg) 0 3px, var(--surface-2) 3px 6px)' :
          it.filled ? 'var(--surface-2)' : it.color,
          border: '1px solid ' + it.border,
          outline: it.strong ? '2px solid var(--my-soft)' : 'none',
          outlineOffset: -1
        }} />
          {it.label}
        </span>
      )}
    </div>);

}

// ── Seat shape ─────────────────────────────────────────────────────────
function Seat({ seat, canBook, isHover, isSelected, onHover, onClick }) {
  const status = seat.status;
  let fill = 'var(--surface)';
  let stroke = 'var(--line-strong)';
  let strokeW = 1;
  let cursor = canBook ? 'pointer' : 'not-allowed';
  if (status === 'occupied') {fill = 'var(--surface-2)';stroke = 'var(--line)';}
  if (status === 'mine') {fill = 'var(--my-soft)';stroke = 'var(--my)';strokeW = 1.5;}
  if (!canBook && status === 'available') {
    fill = 'transparent';stroke = 'var(--line)';
  }
  if (isSelected) {fill = 'var(--primary)';stroke = 'var(--primary)';}
  if (isHover && !isSelected && canBook && status === 'available') {
    fill = 'var(--primary-soft)';stroke = 'var(--primary)';
  }

  return (
    <g style={{ cursor }} data-seat={seat.id}
    onMouseEnter={() => onHover(seat.id)} onMouseLeave={() => onHover(null)}
    onClick={() => onClick(seat)}>
      {/* Desk surface (subtle) */}
      <rect x={seat.x - 1} y={seat.facing === 'down' ? seat.y + seat.h - 6 : seat.y - 5}
      width={seat.w + 2} height={6}
      fill="var(--bg)" stroke="var(--line)" strokeWidth={.5} rx={1} />
      {/* Seat */}
      <rect x={seat.x} y={seat.y} width={seat.w} height={seat.h}
      rx={5} fill={fill} stroke={stroke} strokeWidth={strokeW} />
      {!canBook && status === 'available' &&
      <line x1={seat.x + 4} y1={seat.y + seat.h / 2} x2={seat.x + seat.w - 4} y2={seat.y + seat.h / 2}
      stroke="var(--line-strong)" strokeWidth={.8} strokeDasharray="2 2" />
      }
      {status === 'mine' &&
      <text x={seat.x + seat.w / 2} y={seat.y + seat.h / 2 + 3}
      textAnchor="middle" fontSize={9} fontWeight={600}
      fill="var(--my)" style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
          나
        </text>
      }
      {status === 'available' && canBook && !isSelected && !isHover &&
      <text x={seat.x + seat.w / 2} y={seat.y + seat.h / 2 + 3}
      textAnchor="middle" fontSize={8.5}
      fill="var(--text-3)" style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
          {seat.label}
        </text>
      }
      {(isSelected || isHover && canBook) &&
      <text x={seat.x + seat.w / 2} y={seat.y + seat.h / 2 + 3}
      textAnchor="middle" fontSize={9} fontWeight={600}
      fill={isSelected ? '#fff' : 'var(--primary-text)'}
      style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
          {seat.label}
        </text>
      }
    </g>);

}

// ── Floor map SVG ──────────────────────────────────────────────────────
function FloorMap({ floor, canBook, hoverId, setHoverId, selectedId, onSeatClick, onRoomClick }) {
  return (
    <svg viewBox={floor.viewBox} style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--line)" strokeWidth="1" />
        </pattern>
        <pattern id="lounge-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="var(--line)" />
        </pattern>
      </defs>
      {/* Outer wall */}
      {floor.walls.map((w, i) =>
      <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h}
      fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={1.2} rx={4} />
      )}
      {/* Zones */}
      {floor.zones.map((z, i) => {
        const fill = z.kind === 'core' ? 'url(#hatch)' :
        z.kind === 'lounge' ? 'url(#lounge-dots)' :
        z.kind === 'pantry' ? 'var(--surface-2)' :
        z.kind === 'reception' ? 'var(--surface-2)' :
        'var(--surface-2)';
        return (
          <g key={i}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={fill}
            stroke="var(--line)" strokeWidth={.8} rx={4} />
            <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle"
            fontSize={11} fill="var(--text-3)" fontWeight={500}>
              {z.label}
            </text>
          </g>);

      })}
      {/* Meeting rooms */}
      {floor.rooms.map((r) => {
        const isBooth = r.kind === 'booth';
        return (
          <g key={r.id} style={{ cursor: 'pointer' }} onClick={() => onRoomClick && onRoomClick(r)}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h}
            fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth={1} rx={4} />
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 4} textAnchor="middle"
            fontSize={isBooth ? 9 : 12} fill="var(--text)" fontWeight={600}>
              {r.name}
            </text>
            {!isBooth &&
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 12} textAnchor="middle"
            fontSize={10} fill="var(--text-3)"
            style={{ fontFamily: 'var(--font-mono)' }}>
                {r.capacity}인
              </text>
            }
          </g>);

      })}
      {/* Seats */}
      {floor.seats.map((s) =>
      <Seat key={s.id} seat={s} canBook={canBook}
      isHover={hoverId === s.id} isSelected={selectedId === s.id}
      onHover={setHoverId} onClick={onSeatClick} />
      )}
    </svg>);

}

// ── Booking modal ─────────────────────────────────────────────────────
function BookingModal({ seat, onClose, onConfirm }) {
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const times = [];
  for (let h = 8; h <= 20; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    times.push(`${String(h).padStart(2, '0')}:30`);
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <div className="modal-title">좌석 예약</div>
            <div className="small muted" style={{ marginTop: 2 }}>
              분당캠퍼스 · 두산타워 · 13F
            </div>
          </div>
          <button className="topbar-icon-btn" onClick={onClose}><I.X size={16} /></button>
        </div>
        <div className="modal-body col" style={{ gap: 14 }}>
          <div className="card card-pad row" style={{ gap: 12, background: 'var(--surface-2)' }}>
            <div style={{
              width: 44, height: 38, borderRadius: 6,
              background: 'var(--my-soft)', border: '1.5px solid var(--my)',
              display: 'grid', placeItems: 'center', fontWeight: 600,
              color: 'var(--my)', fontFamily: 'var(--font-mono)', fontSize: 12
            }}>
              {seat.label}
            </div>
            <div className="col" style={{ gap: 2 }}>
              <div style={{ fontWeight: 600 }}>좌석 {seat.label}</div>
              <div className="small muted">개인 좌석 · 모니터 듀얼 · 스탠딩 데스크</div>
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <div className="field grow">
              <label className="field-label">시작</label>
              <select className="select" value={start} onChange={(e) => setStart(e.target.value)}>
                {times.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field grow">
              <label className="field-label">종료</label>
              <select className="select" value={end} onChange={(e) => setEnd(e.target.value)}>
                {times.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {[
            ['반나절 오전', '09:00', '13:00'],
            ['반나절 오후', '13:00', '18:00'],
            ['하루 종일', '09:00', '18:00']].
            map(([l, s, e]) =>
            <button key={l} className="btn btn-sm"
            onClick={() => {setStart(s);setEnd(e);}}>
                {l}
              </button>
            )}
          </div>
          <div className="field">
            <label className="field-label">반복</label>
            <select className="select" defaultValue="none">
              <option value="none">반복 없음</option>
              <option>매일 (월–금)</option>
              <option>이번 주 매일</option>
              <option>이번 달 매주 월요일</option>
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={() => onConfirm({ seat, start, end })}>
            <I.Check size={14} /> 예약 확정
          </button>
        </div>
      </div>
    </div>);

}

// ── Booking side panel ───────────────────────────────────────────────
function BookingPanel({ seat, onClose, onConfirm }) {
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const times = [];
  for (let h = 8; h <= 20; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    times.push(`${String(h).padStart(2, '0')}:30`);
  }
  return (
    <aside className="card slide-r" style={{
      width: 320, padding: 18, alignSelf: 'stretch',
      display: 'flex', flexDirection: 'column', gap: 14,
      position: 'sticky', top: 'calc(var(--header-h) + var(--sub-h) + 20px)',
      maxHeight: 'calc(100vh - var(--header-h) - var(--sub-h) - 40px)',
      overflow: 'auto'
    }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="h3">좌석 예약</div>
        <button className="topbar-icon-btn" onClick={onClose}><I.X size={14} /></button>
      </div>
      <div className="card card-pad row" style={{ gap: 12, background: 'var(--surface-2)' }}>
        <div style={{
          width: 44, height: 38, borderRadius: 6,
          background: 'var(--my-soft)', border: '1.5px solid var(--my)',
          display: 'grid', placeItems: 'center', fontWeight: 600,
          color: 'var(--my)', fontFamily: 'var(--font-mono)', fontSize: 12
        }}>{seat.label}</div>
        <div className="col" style={{ gap: 2 }}>
          <div style={{ fontWeight: 600 }}>좌석 {seat.label}</div>
          <div className="smaller muted">모니터 듀얼 · 스탠딩 데스크</div>
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <div className="field grow">
          <label className="field-label">시작</label>
          <select className="select" value={start} onChange={(e) => setStart(e.target.value)}>
            {times.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field grow">
          <label className="field-label">종료</label>
          <select className="select" value={end} onChange={(e) => setEnd(e.target.value)}>
            {times.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="col" style={{ gap: 6 }}>
        <div className="field-label">빠른 선택</div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {[['오전', '09:00', '13:00'], ['오후', '13:00', '18:00'], ['종일', '09:00', '18:00']].map(([l, s, e]) =>
          <button key={l} className="btn btn-sm" onClick={() => {setStart(s);setEnd(e);}}>{l}</button>
          )}
        </div>
      </div>
      <div className="field">
        <label className="field-label">메모 (선택)</label>
        <input className="input" placeholder="동료와 공유할 메모" />
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-lg" onClick={() => onConfirm({ seat, start, end })}>
        <I.Check size={14} /> 예약 확정
      </button>
    </aside>);

}

// ── Pan + zoom wrapper ────────────────────────────────────────────────
function PanZoomMap({ viewBox, children }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef(null);
  const wrapRef = useRef(null);

  const onWheel = (e) => {
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const next = Math.max(0.5, Math.min(3, scale * factor));
    const k = next / scale;
    // Zoom toward cursor
    setTx((cx - k * (cx - tx)));
    setTy((cy - k * (cy - ty)));
    setScale(next);
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e) => onWheel(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [scale, tx, ty]);

  const onDown = (e) => {
    if (e.target.closest('[data-seat]')) return;
    dragRef.current = { x: e.clientX - tx, y: e.clientY - ty };
    e.currentTarget.style.cursor = 'grabbing';
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    setTx(e.clientX - dragRef.current.x);
    setTy(e.clientY - dragRef.current.y);
  };
  const onUp = (e) => {
    dragRef.current = null;
    if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
  };
  const reset = () => { setScale(1); setTx(0); setTy(0); };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: 520, overflow: 'hidden', cursor: 'grab', touchAction: 'none' }}
         onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        transformOrigin: '0 0',
      }}>
        {children}
      </div>
      <div className="row" style={{
        position: 'absolute', right: 12, bottom: 12, gap: 4,
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8,
        padding: 4, boxShadow: 'var(--shadow)',
      }}>
        <button className="topbar-icon-btn" onClick={() => { const n = Math.min(3, scale * 1.2); setScale(n); }} title="확대"><span style={{ fontSize: 16, fontWeight: 600 }}>+</span></button>
        <span className="mono smaller" style={{ minWidth: 42, textAlign: 'center', alignSelf: 'center', color: 'var(--text-2)' }}>{Math.round(scale * 100)}%</span>
        <button className="topbar-icon-btn" onClick={() => { const n = Math.max(0.5, scale / 1.2); setScale(n); }} title="축소"><span style={{ fontSize: 16, fontWeight: 600 }}>−</span></button>
        <div style={{ width: 1, background: 'var(--line)', margin: '4px 2px' }} />
        <button className="topbar-icon-btn" onClick={reset} title="초기화"><I.Move size={14} /></button>
      </div>
    </div>
  );
}

// ── Quick booking pop ─────────────────────────────────────────────────
function QuickBookPop({ seat, x, y, onClose, onConfirm }) {
  return (
    <div className="card pop" style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, calc(-100% - 12px))',
      padding: 12, width: 220, boxShadow: 'var(--shadow-lg)', zIndex: 20
    }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="h3">{seat.label}</div>
        <div className="grow" />
        <button className="topbar-icon-btn" onClick={onClose}><I.X size={12} /></button>
      </div>
      <div className="col" style={{ gap: 6 }}>
        {[
        ['오전 (09:00 – 13:00)', '09:00', '13:00'],
        ['오후 (13:00 – 18:00)', '13:00', '18:00'],
        ['하루 종일 (09:00 – 18:00)', '09:00', '18:00']].
        map(([l, s, e]) =>
        <button key={l} className="btn btn-sm" style={{ justifyContent: 'flex-start' }}
        onClick={() => onConfirm({ seat, start: s, end: e })}>
            <I.Clock size={12} />{l}
          </button>
        )}
      </div>
    </div>);

}

// ── Seat booking screen ──────────────────────────────────────────────
function SeatBookingScreen({ floor, floorMeta, date, interaction, onBook }) {
  const [hoverId, setHoverId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [quickPos, setQuickPos] = useState(null);
  const [seats, setSeats] = useState(floor.seats);
  useEffect(() => {setSeats(floor.seats);setSelected(null);setQuickPos(null);}, [floor.id]);

  const canBook = window.HS_USER.bookableFloors.includes(floorMeta.id);

  const counts = useMemo(() => {
    const total = seats.length;
    const avail = seats.filter((s) => s.status === 'available').length;
    const occ = seats.filter((s) => s.status === 'occupied').length;
    const mine = seats.filter((s) => s.status === 'mine').length;
    return { total, avail, occ, mine };
  }, [seats]);

  const onSeatClick = (seat, ev) => {
    if (!canBook) return;
    if (seat.status === 'mine') return;
    if (seat.status === 'occupied') return;
    if (interaction === 'quick') {
      // get center of seat in viewport pixels
      const svg = document.querySelector('.floor-map-svg');
      if (svg) {
        const pt = svg.createSVGPoint();
        pt.x = seat.x + seat.w / 2;pt.y = seat.y;
        const screenP = pt.matrixTransform(svg.getScreenCTM());
        const wrap = document.querySelector('.floor-map-wrap');
        const wr = wrap.getBoundingClientRect();
        setSelected(seat);
        setQuickPos({ x: screenP.x - wr.left, y: screenP.y - wr.top });
      }
    } else {
      setSelected(seat);
    }
  };

  const confirmBook = async ({ seat, start, end }) => {
    // Optimistic UI update
    setSeats((prev) => prev.map((s) => s.id === seat.id ?
    { ...s, status: 'mine', occupant: { name: window.HS_USER.name, team: window.HS_USER.team || 'AI Platform' } } :
    s));
    setSelected(null);setQuickPos(null);
    onBook(`${seat.label} 좌석을 ${start}–${end}로 예약했습니다`);
    // Real API call
    if (window.HySpaceAPI) {
      await HySpaceAPI.createReservation({
        kind: 'seat', target_id: seat.id, floor_id: floor.id,
        date: window.__currentDate, start_time: start, end_time: end,
      });
    }
  };

  // Layout split based on interaction
  const showSidePanel = interaction === 'panel' && selected;
  const showModal = interaction === 'modal' && selected;
  const showQuick = interaction === 'quick' && selected && quickPos;

  return (
    <div className="col" style={{ gap: 14 }}>
      {/* Stats strip */}
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }} data-comment-anchor="3470882a27-div-387-7">
        <StatCard label="전체 좌석" value={counts.total} />
        <StatCard label="예약 가능" value={counts.avail} accent="ok" />
        <StatCard label="예약됨" value={counts.occ} />
        <StatCard label="내 좌석" value={counts.mine} accent="primary" />
        <div className="grow mobile-hide" />
      </div>

      {!canBook &&
      <div className="card card-pad row fadein" style={{
        gap: 10, background: 'var(--warn-soft)', borderColor: 'transparent', color: '#7A4F0E'
      }}>
          <I.Eye size={16} />
          <div>
            <strong>{floorMeta.label}는 {floorMeta.affiliation} 영역</strong>입니다.
            현재 소속({window.HS_USER.affiliation})은 조회만 가능하며 예약할 수 없습니다.
          </div>
        </div>
      }

      <div className="row" style={{ gap: 14, alignItems: 'stretch' }}>
        <div className="card grow" style={{ overflow: 'hidden', minHeight: 520, position: 'relative' }}>
          <div className="row" style={{
            padding: '12px 16px', borderBottom: '1px solid var(--line)',
            background: 'var(--surface-2)', justifyContent: 'space-between'
          }}>
            <div className="row" style={{ gap: 10 }}>
              <div className="h3">{floor.name}</div>
              <span className="pill" data-color="muted">
                {floor.viewBox.split(' ')[2]} × {floor.viewBox.split(' ')[3]} units
              </span>
            </div>
            <SeatStatusLegend />
          </div>
          <div className="floor-map-wrap" style={{
            padding: 14, background: 'var(--bg)',
            position: 'relative', overflow: 'hidden',
            minHeight: 520
          }}>
            <PanZoomMap viewBox={floor.viewBox}>
              <svg className="floor-map-svg" viewBox={floor.viewBox}
              style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}>
                <defs>
                  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-strong)" strokeWidth="1" />
                  </pattern>
                  <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="var(--line-strong)" />
                  </pattern>
                </defs>
                {floor.walls.map((w, i) =>
                <rect key={i} x={w.x} y={w.y} width={w.w} height={w.h}
                fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={1.5} rx={4} data-comment-anchor="6b685d1b01-rect-442-19" />
                )}
                {floor.zones.map((z, i) => {
                  const fill = z.kind === 'core' ? 'url(#hatch)' :
                  z.kind === 'lounge' ? 'url(#dots)' :
                  'var(--surface-2)';
                  return (
                    <g key={i}>
                      <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={fill}
                      stroke="var(--line)" strokeWidth={.8} rx={4} />
                      <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 3} textAnchor="middle"
                      fontSize={11} fill="var(--text-3)" fontWeight={500}>
                        {z.label}
                      </text>
                    </g>);

                })}
                {floor.rooms.map((r) => {
                  const isBooth = r.kind === 'booth';
                  return (
                    <g key={r.id}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h}
                      fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth={1} rx={4} />
                      <text x={r.x + r.w / 2} y={r.y + r.h / 2 - (isBooth ? 0 : 4)} textAnchor="middle"
                      fontSize={isBooth ? 9 : 12} fill="var(--text)" fontWeight={600}>
                        {r.name}
                      </text>
                      {!isBooth &&
                      <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 12} textAnchor="middle"
                      fontSize={10} fill="var(--text-3)"
                      style={{ fontFamily: 'var(--font-mono)' }}>
                          {r.capacity}인
                        </text>
                      }
                    </g>);

                })}
                {seats.map((s) =>
                <Seat key={s.id} seat={s} canBook={canBook}
                isHover={hoverId === s.id} isSelected={selected?.id === s.id}
                onHover={setHoverId} onClick={onSeatClick} />
                )}
              </svg>
            </PanZoomMap>
            {showQuick &&
            <QuickBookPop seat={selected} x={quickPos.x} y={quickPos.y}
            onClose={() => {setSelected(null);setQuickPos(null);}}
            onConfirm={confirmBook} />
            }
          </div>
          {/* Hover info bar */}
          <div className="row" style={{
            padding: '10px 16px', borderTop: '1px solid var(--line)', minHeight: 44,
            background: 'var(--surface)', gap: 10
          }}>
            {(() => {
              const s = seats.find((x) => x.id === hoverId);
              if (!s) return <span className="muted small">좌석에 마우스를 올려 정보를 확인하세요.</span>;
              return (
                <>
                  <span className="mono" style={{ fontWeight: 600 }}>{s.label}</span>
                  <span className="muted">·</span>
                  {s.status === 'available' && <span className="pill" data-color="ok">예약 가능</span>}
                  {s.status === 'occupied' &&
                  <>
                      <span className="pill" data-color="muted">예약됨</span>
                      <span className="muted small">{s.occupant?.name} · {s.occupant?.team}</span>
                    </>
                  }
                  {s.status === 'mine' && <span className="pill" data-color="primary">내 좌석 · 09:00–18:00</span>}
                </>);

            })()}
          </div>
        </div>
        {showSidePanel &&
        <BookingPanel seat={selected} onClose={() => setSelected(null)} onConfirm={confirmBook} />
        }
      </div>

      {showModal &&
      <BookingModal seat={selected} onClose={() => setSelected(null)} onConfirm={confirmBook} />
      }
    </div>);

}

function StatCard({ label, value, accent }) {
  const color = accent === 'primary' ? 'var(--primary)' :
  accent === 'ok' ? 'var(--ok)' : 'var(--text)';
  return (
    <div className="card card-pad" style={{ minWidth: 110 }}>
      <div className="smaller muted">{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 600, color, marginTop: 2 }}>{value}</div>
    </div>);

}

window.SeatBookingScreen = SeatBookingScreen;
window.StatCard = StatCard;