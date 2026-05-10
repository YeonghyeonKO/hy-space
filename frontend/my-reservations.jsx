// My reservations screen — list of upcoming/past bookings.

function MyReservationsScreen({ onCancel }) {
  const [items, setItems] = useState(window.HS_MY_RESERVATIONS || []);
  const [tab, setTab] = useState('upcoming');
  const [confirmCancel, setConfirmCancel] = useState(null);

  // Load from real API on mount
  useEffect(() => {
    (async () => {
      const data = await HySpaceAPI.getMyReservations();
      if (data && data.length) {
        // Transform API response to match UI format
        const today = new Date();
        const transformed = data.map(r => ({
          id: r.id,
          kind: r.kind,
          location: { campus: '분당캠퍼스', building: '두산타워', floor: r.floor_id?.replace('doosan-','') || '', spot: r.target_id },
          date: r.date,
          start: r.start_time,
          end: r.end_time,
          status: new Date(r.date) < new Date(today.toDateString()) ? 'past' : r.status,
          title: r.title,
          attendees: r.attendees,
        }));
        setItems(transformed);
      }
    })();
  }, []);

  const upcoming = items.filter((r) => r.status !== 'past' && r.status !== 'cancelled');
  const past = items.filter((r) => r.status === 'past' || r.status === 'cancelled');
  const list = tab === 'upcoming' ? upcoming : past;

  const cancel = async (id) => {
    // Call real API to cancel
    await HySpaceAPI.cancelReservation(id);
    setItems((prev) => prev.filter((r) => r.id !== id));
    setConfirmCancel(null);
    onCancel('예약이 취소되었습니다');
  };

  const groupByDate = (arr) => {
    const m = new Map();
    for (const r of arr) {
      if (!m.has(r.date)) m.set(r.date, []);
      m.get(r.date).push(r);
    }
    return Array.from(m.entries()).sort(([a], [b]) => tab === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a));
  };
  const groups = groupByDate(list);

  const prettyDate = (d) => {
    const t = new Date(d);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const today = new Date(2026, 4, 10);
    const tom = new Date(today); tom.setDate(today.getDate() + 1);
    if (t.toDateString() === today.toDateString()) return `오늘 · ${t.getMonth() + 1}월 ${t.getDate()}일 ${days[t.getDay()]}요일`;
    if (t.toDateString() === tom.toDateString()) return `내일 · ${t.getMonth() + 1}월 ${t.getDate()}일 ${days[t.getDay()]}요일`;
    return `${t.getMonth() + 1}월 ${t.getDate()}일 ${days[t.getDay()]}요일`;
  };

  return (
    <div className="col" style={{ gap: 14, maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="예정 예약" value={upcoming.length} accent="primary" />
        <StatCard label="이번 주 좌석" value={upcoming.filter((r) => r.kind === 'seat').length} />
        <StatCard label="이번 주 회의실" value={upcoming.filter((r) => r.kind === 'room').length} />
        <StatCard label="총 누적" value={items.length} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row" style={{
          borderBottom: '1px solid var(--line)', background: 'var(--surface-2)',
          padding: '0 8px',
        }}>
          {[
            ['upcoming', '예정', upcoming.length],
            ['past', '지난 예약', past.length],
          ].map(([id, label, n]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: 'transparent', border: 0,
              padding: '14px 14px 12px',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              color: tab === id ? 'var(--text)' : 'var(--text-3)',
              borderBottom: '2px solid ' + (tab === id ? 'var(--primary)' : 'transparent'),
              marginBottom: -1, cursor: 'pointer',
            }}>
              {label} <span className="mono" style={{ marginLeft: 4, opacity: .7 }}>{n}</span>
            </button>
          ))}
          <div className="grow" />
          <div className="row" style={{ gap: 6, paddingRight: 8 }}>
            <button className="btn btn-sm btn-ghost"><I.Filter size={12} /> 필터</button>
          </div>
        </div>

        <div style={{ padding: 0 }}>
          {groups.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div className="muted small">{tab === 'upcoming' ? '예정된 예약이 없습니다.' : '지난 예약이 없습니다.'}</div>
            </div>
          )}
          {groups.map(([d, arr]) => (
            <div key={d}>
              <div style={{
                padding: '14px 18px 6px',
                fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--line)',
              }}>
                {prettyDate(d)}
              </div>
              {arr.map((r) => (
                <div key={r.id} className="row" style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--line)',
                  gap: 14,
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: r.kind === 'seat' ? 'var(--primary-soft)' : 'var(--ok-soft)',
                    color: r.kind === 'seat' ? 'var(--primary)' : 'var(--ok)',
                    display: 'grid', placeItems: 'center', flex: '0 0 auto',
                  }}>
                    {r.kind === 'seat' ? <I.Seat size={18} /> : <I.Room size={18} />}
                  </div>
                  <div className="col grow" style={{ gap: 4, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {r.kind === 'seat' ? `좌석 ${r.location.spot}` : (r.title || `${r.location.spot} 회의실`)}
                      </div>
                      {r.kind === 'room' && (
                        <span className="pill" data-color="muted">
                          <I.Group size={11} /> {r.attendees}명
                        </span>
                      )}
                      {r.status === 'past' && <span className="pill" data-color="muted">완료</span>}
                    </div>
                    <div className="small muted">
                      <span className="mono">{r.start} – {r.end}</span>
                      <span style={{ margin: '0 8px' }}>·</span>
                      {r.location.campus} / {r.location.building} / {r.location.floor}
                      {r.kind === 'room' && (<><span style={{ margin: '0 8px' }}>·</span>{r.location.spot}</>)}
                    </div>
                  </div>
                  {r.status !== 'past' && (
                    <div className="row mobile-hide" style={{ gap: 6, flex: '0 0 auto' }}>
                      <button className="btn btn-sm">변경</button>
                      <button className="btn btn-sm" onClick={() => setConfirmCancel(r)}>취소</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {confirmCancel && (
        <div className="modal-bg" onClick={() => setConfirmCancel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-hd">
              <div className="modal-title">예약을 취소하시겠습니까?</div>
              <button className="topbar-icon-btn" onClick={() => setConfirmCancel(null)}><I.X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
                <div style={{ fontWeight: 600 }}>
                  {confirmCancel.kind === 'seat' ? `좌석 ${confirmCancel.location.spot}` : (confirmCancel.title || confirmCancel.location.spot)}
                </div>
                <div className="small muted mono" style={{ marginTop: 4 }}>
                  {confirmCancel.date} · {confirmCancel.start} – {confirmCancel.end}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setConfirmCancel(null)}>아니요</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => cancel(confirmCancel.id)}>예약 취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.MyReservationsScreen = MyReservationsScreen;
