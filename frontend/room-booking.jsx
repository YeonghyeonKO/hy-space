// Room booking screen — time slot grid for meeting rooms.

function RoomBookingScreen({ floor, floorMeta, date, dense, onBook }) {
  const canBook = window.HS_USER.bookableFloors.includes(floorMeta.id);
  const [filterCap, setFilterCap] = useState(0);
  const [filterAmenity, setFilterAmenity] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null); // { roomId, start, end }
  const [bookings, setBookings] = useState(window.HS_ROOM_BOOKINGS_13F);
  const [showModal, setShowModal] = useState(null);

  const meetingRooms = floor.rooms.filter((r) => r.kind !== 'booth');
  const filtered = meetingRooms.filter((r) => {
    if (filterCap && r.capacity < filterCap) return false;
    if (filterAmenity && !(r.amenities || []).includes(filterAmenity)) return false;
    return true;
  });

  // Time slots
  const startH = 8, endH = 19;
  const stepMin = dense ? 15 : 30;
  const slots = [];
  for (let h = startH; h < endH; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      slots.push({ h, m, label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` });
    }
  }
  const slotW = dense ? 22 : 36;
  const rowH = 48;

  const minutesFrom = (t) => {
    const [h, m] = t.split(':').map(Number);
    return (h - startH) * 60 + m;
  };
  const slotIndex = (t) => Math.floor(minutesFrom(t) / stepMin);

  // Drag select
  const dragRef = useRef(null);
  const onSlotDown = (room, idx, e) => {
    if (!canBook) return;
    if (floor.id !== 'doosan-13F') return; // only 13F has bookings data
    dragRef.current = { roomId: room.id, start: idx, end: idx };
    setSelectedRange({ roomId: room.id, start: idx, end: idx });
    const move = (ev) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const cell = el?.closest('[data-slot]');
      if (cell && cell.dataset.room === room.id) {
        const j = Number(cell.dataset.slot);
        dragRef.current.end = j;
        setSelectedRange({ roomId: room.id, start: dragRef.current.start, end: j });
      }
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const r = dragRef.current;
      if (r) {
        const sIdx = Math.min(r.start, r.end);
        const eIdx = Math.max(r.start, r.end) + 1;
        setShowModal({
          room, startIdx: sIdx, endIdx: eIdx,
          start: slots[sIdx].label,
          end: eIdx >= slots.length ? `${endH}:00` : slots[eIdx].label,
        });
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const confirmRoomBook = async ({ room, start, end, title }) => {
    // Optimistic UI update
    setBookings((prev) => ({
      ...prev,
      [room.id]: [...(prev[room.id] || []), {
        start, end, title: title || '예약', owner: window.HS_USER.name, mine: true,
      }],
    }));
    setShowModal(null);
    setSelectedRange(null);
    onBook(`${room.name} 회의실을 ${start}–${end}로 예약했습니다`);
    // Real API call
    if (window.HySpaceAPI) {
      await HySpaceAPI.createReservation({
        kind: 'room', target_id: room.id, floor_id: floor.id,
        date: window.__currentDate, start_time: start, end_time: end, title: title || '예약',
      });
    }
  };

  // Now indicator: 14:35 on 2026-05-10
  const nowMin = 14 * 60 + 35 - startH * 60;
  const nowX = (nowMin / stepMin) * slotW;

  return (
    <div className="col" style={{ gap: 14 }}>
      {/* Filters */}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <span className="small muted" style={{ marginRight: 4 }}>최소 인원</span>
        {[0, 4, 6, 8, 12].map((c) => (
          <button key={c} className="btn btn-sm"
                  style={c === filterCap ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}
                  onClick={() => setFilterCap(c)}>
            {c === 0 ? '전체' : `${c}+`}
          </button>
        ))}
        <span className="small muted" style={{ marginLeft: 12, marginRight: 4 }}>장비</span>
        {['화면', '화상회의', 'TV'].map((a) => (
          <button key={a} className="btn btn-sm"
                  style={a === filterAmenity ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}
                  onClick={() => setFilterAmenity(filterAmenity === a ? null : a)}>
            {a}
          </button>
        ))}
        <div className="grow" />
        <span className="small muted">총 {filtered.length}개</span>
      </div>

      {!canBook && (
        <div className="card card-pad row fadein" style={{
          gap: 10, background: 'var(--warn-soft)', borderColor: 'transparent', color: '#7A4F0E',
        }}>
          <I.Eye size={16} />
          <div><strong>{floorMeta.label}는 조회 전용</strong>입니다. 회의실 가용성만 확인 가능합니다.</div>
        </div>
      )}

      {/* Time grid */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row" style={{
          padding: '12px 16px', borderBottom: '1px solid var(--line)',
          background: 'var(--surface-2)', justifyContent: 'space-between',
        }}>
          <div className="h3">{floor.name} · 회의실 시간대</div>
          <div className="row small muted" style={{ gap: 14 }}>
            <span className="row" style={{ gap: 6 }}>
              <span style={{ width: 12, height: 10, background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 2 }} />
              가능
            </span>
            <span className="row" style={{ gap: 6 }}>
              <span style={{ width: 12, height: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 2 }} />
              예약됨
            </span>
            <span className="row" style={{ gap: 6 }}>
              <span style={{ width: 12, height: 10, background: 'var(--my-soft)', border: '1.5px solid var(--my)', borderRadius: 2 }} />
              내 예약
            </span>
          </div>
        </div>

        <div style={{ overflow: 'auto', position: 'relative' }}>
          <div style={{ minWidth: 220 + slots.length * slotW + 20 }}>
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: `220px 1fr`,
              borderBottom: '1px solid var(--line)', background: 'var(--surface)',
              position: 'sticky', top: 0, zIndex: 2,
            }}>
              <div style={{ padding: '8px 14px', fontWeight: 600, fontSize: 12, color: 'var(--text-2)', borderRight: '1px solid var(--line)' }}>회의실</div>
              <div style={{ position: 'relative', height: 36 }}>
                {slots.map((s, i) => (
                  s.m === 0 && (
                    <div key={i} style={{
                      position: 'absolute', left: i * slotW, top: 0, bottom: 0,
                      borderLeft: '1px solid var(--line)', paddingLeft: 4, paddingTop: 8,
                      fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
                      width: dense ? 80 : 60,
                    }}>{s.label}</div>
                  )
                ))}
              </div>
            </div>

            {/* Rows */}
            {filtered.map((room) => {
              const roomBookings = (bookings[room.id] || []);
              return (
                <div key={room.id} style={{
                  display: 'grid', gridTemplateColumns: `220px 1fr`,
                  borderBottom: '1px solid var(--line)',
                  background: 'var(--surface)',
                }}>
                  <div style={{
                    padding: '10px 14px', borderRight: '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: 'var(--surface-2)',
                      display: 'grid', placeItems: 'center', flex: '0 0 auto',
                      border: '1px solid var(--line)',
                    }}>
                      <I.Room size={14} />
                    </div>
                    <div className="col" style={{ gap: 2, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{room.name}</div>
                      <div className="row" style={{ gap: 4 }}>
                        <span className="smaller muted"><I.Group size={11} style={{ verticalAlign: -1 }} /> {room.capacity}인</span>
                        {(room.amenities || []).slice(0, 2).map((a) => (
                          <span key={a} className="smaller muted">· {a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div
                    onMouseDown={(e) => {
                      const wrap = e.currentTarget.getBoundingClientRect();
                      const idx = Math.floor((e.clientX - wrap.left) / slotW);
                      onSlotDown(room, Math.max(0, Math.min(slots.length - 1, idx)), e);
                    }}
                    style={{
                      position: 'relative', height: rowH,
                      background: `repeating-linear-gradient(90deg,
                        transparent 0 ${slotW * (60 / stepMin) - 1}px,
                        var(--line) ${slotW * (60 / stepMin) - 1}px ${slotW * (60 / stepMin)}px)`,
                      cursor: canBook ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}>
                    {/* Half-hour ticks */}
                    {slots.map((_, i) => (
                      <div key={i} data-slot={i} data-room={room.id}
                           style={{ position: 'absolute', left: i * slotW, top: 0, bottom: 0, width: slotW }} />
                    ))}
                    {/* Now line */}
                    <div style={{
                      position: 'absolute', left: nowX, top: 0, bottom: 0,
                      width: 1, background: 'var(--danger)', zIndex: 3,
                    }}>
                      <div style={{
                        position: 'absolute', top: -4, left: -4, width: 8, height: 8,
                        background: 'var(--danger)', borderRadius: 4,
                      }} />
                    </div>
                    {/* Existing bookings */}
                    {roomBookings.map((b, i) => {
                      const sIdx = slotIndex(b.start);
                      const eIdx = slotIndex(b.end);
                      return (
                        <div key={i} className="fadein" style={{
                          position: 'absolute',
                          left: sIdx * slotW + 1, top: 4,
                          width: (eIdx - sIdx) * slotW - 2, height: rowH - 8,
                          background: b.mine ? 'var(--my-soft)' : 'var(--surface-2)',
                          border: '1px solid ' + (b.mine ? 'var(--my)' : 'var(--line-strong)'),
                          borderLeft: '3px solid ' + (b.mine ? 'var(--my)' : 'var(--text-3)'),
                          borderRadius: 4, padding: '4px 6px',
                          fontSize: 11, color: b.mine ? 'var(--my)' : 'var(--text-2)',
                          overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                          pointerEvents: 'none',
                        }}>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.title}
                          </div>
                          <div className="mono smaller" style={{ opacity: .8 }}>
                            {b.start}–{b.end} · {b.owner}
                          </div>
                        </div>
                      );
                    })}
                    {/* Selection drag overlay */}
                    {selectedRange?.roomId === room.id && (
                      (() => {
                        const s = Math.min(selectedRange.start, selectedRange.end);
                        const e = Math.max(selectedRange.start, selectedRange.end) + 1;
                        return (
                          <div style={{
                            position: 'absolute', left: s * slotW, top: 2,
                            width: (e - s) * slotW, height: rowH - 4,
                            background: 'var(--primary-soft)',
                            border: '1.5px solid var(--primary)',
                            borderRadius: 4, pointerEvents: 'none', zIndex: 2,
                          }}>
                            <div className="mono" style={{
                              position: 'absolute', top: 4, left: 6, fontSize: 11,
                              color: 'var(--primary-text)', fontWeight: 600,
                            }}>
                              {slots[s].label}–{e >= slots.length ? `${endH}:00` : slots[e].label}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <RoomBookingModal data={showModal} onClose={() => { setShowModal(null); setSelectedRange(null); }}
                          onConfirm={confirmRoomBook} />
      )}
    </div>
  );
}

function RoomBookingModal({ data, onClose, onConfirm }) {
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState(2);
  const { room, start, end } = data;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <div className="modal-title">회의실 예약</div>
            <div className="small muted" style={{ marginTop: 2 }}>
              {room.name} · 분당 두산타워 13F
            </div>
          </div>
          <button className="topbar-icon-btn" onClick={onClose}><I.X size={16} /></button>
        </div>
        <div className="modal-body col" style={{ gap: 14 }}>
          <div className="card card-pad row" style={{ gap: 12, background: 'var(--surface-2)' }}>
            <div style={{
              width: 44, height: 38, borderRadius: 6,
              background: 'var(--my-soft)', border: '1.5px solid var(--my)',
              display: 'grid', placeItems: 'center', color: 'var(--my)',
            }}>
              <I.Room size={18} />
            </div>
            <div className="col" style={{ gap: 2 }}>
              <div style={{ fontWeight: 600 }}>{room.name} · {room.capacity}인</div>
              <div className="small muted mono">{start} – {end} · 2026.05.10</div>
            </div>
          </div>
          <div className="field">
            <label className="field-label">회의 제목</label>
            <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                   placeholder="예: Sprint Planning, 1:1 with..." />
          </div>
          <div className="row" style={{ gap: 10 }}>
            <div className="field grow">
              <label className="field-label">참석자 수</label>
              <input className="input mono" type="number" min={1} max={room.capacity}
                     value={attendees} onChange={(e) => setAttendees(Number(e.target.value))} />
            </div>
            <div className="field grow">
              <label className="field-label">유형</label>
              <select className="select" defaultValue="internal">
                <option value="internal">내부 회의</option>
                <option>외부 미팅</option>
                <option>인터뷰</option>
                <option>교육</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field-label">참석자</label>
            <div className="card" style={{
              padding: '8px 10px', minHeight: 38, display: 'flex', flexWrap: 'wrap', gap: 4,
            }}>
              <span className="pill" data-color="primary">{window.HS_USER.name}</span>
              <span className="pill">박서연</span>
              <span className="pill">이도윤</span>
              <button className="btn btn-sm btn-ghost"><I.Plus size={12} /> 추가</button>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={() => onConfirm({ room, start, end, title })}>
            <I.Check size={14} /> 예약 확정
          </button>
        </div>
      </div>
    </div>
  );
}

window.RoomBookingScreen = RoomBookingScreen;
