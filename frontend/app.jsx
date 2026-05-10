// HySpace main App — sidebar nav, top/sub bar, screen routing.
// Works standalone with fallback data OR with backend API.

const { useState, useEffect, useRef, useMemo } = React;

// ── Fallback static data (used when API is unavailable) ─────────────────

window.HS_USER = window.HS_USER || {
  id: 'u-100', name: '김지훈', email: 'jihoon.kim@skhynix.com',
  affiliation: 'SK하이닉스', team: 'AI Platform / DevOps',
  bookableFloors: ['5F', '12F', '13F', '14F', '15F'],
};

window.HS_AFFILIATIONS = window.HS_AFFILIATIONS || {
  'SK하이닉스': { color: '#2A5BD7', floors: ['5F', '12F', '13F', '14F', '15F'] },
  'SK AX': { color: '#7A5AE0', floors: ['8F', '9F', '10F', '11F'] },
  '협력사': { color: '#8B92A0', floors: [] },
};

window.HS_CAMPUSES = window.HS_CAMPUSES || [
  {
    id: 'bundang', name: '분당캠퍼스', address: '경기 성남시 분당구',
    buildings: [
      {
        id: 'doosan', name: '두산타워',
        floors: [
          { id: '5F', label: '5F', affiliation: 'SK하이닉스', desc: '디자인/리서치' },
          { id: '8F', label: '8F', affiliation: 'SK AX', desc: 'Cloud Engineering' },
          { id: '9F', label: '9F', affiliation: 'SK AX', desc: 'Data & ML' },
          { id: '10F', label: '10F', affiliation: 'SK AX', desc: 'Solution Sales' },
          { id: '11F', label: '11F', affiliation: 'SK AX', desc: 'Consulting' },
          { id: '12F', label: '12F', affiliation: 'SK하이닉스', desc: 'Memory Architecture' },
          { id: '13F', label: '13F', affiliation: 'SK하이닉스', desc: 'AI Platform' },
          { id: '14F', label: '14F', affiliation: 'SK하이닉스', desc: 'DRAM Design' },
          { id: '15F', label: '15F', affiliation: 'SK하이닉스', desc: 'Executive' },
        ],
      },
      { id: 'rnd', name: 'R&D센터', floors: [
        { id: '5F', label: '5F', affiliation: 'SK하이닉스', desc: 'Lab A' },
        { id: '12F', label: '12F', affiliation: 'SK하이닉스', desc: 'Lab B' },
        { id: '13F', label: '13F', affiliation: 'SK하이닉스', desc: 'Lab C' },
      ]},
    ],
  },
  { id: 'icheon', name: '이천캠퍼스', address: '경기 이천시', buildings: [
    { id: 'main', name: '본관', floors: [
      { id: '5F', label: '5F', affiliation: 'SK하이닉스', desc: 'Fab Engineering' },
      { id: '12F', label: '12F', affiliation: 'SK하이닉스', desc: 'Process Tech' },
    ]},
  ]},
  { id: 'cheongju', name: '청주캠퍼스', address: '충북 청주시', buildings: [
    { id: 'main', name: '본관', floors: [
      { id: '13F', label: '13F', affiliation: 'SK하이닉스', desc: 'NAND R&D' },
    ]},
  ]},
];

// Generate fallback floor data
function _cluster(cx, cy, cols, rows, prefix, sizeW = 36, sizeH = 32, gapX = 6, gapY = 16) {
  const seats = []; let n = 1;
  const totalW = cols * sizeW + (cols - 1) * gapX;
  const totalH = rows * sizeH + (rows - 1) * gapY;
  const x0 = cx - totalW / 2, y0 = cy - totalH / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seats.push({ id: `${prefix}-${n.toString().padStart(2,'0')}`, label: `${prefix}${n}`,
        x: x0 + c * (sizeW + gapX), y: y0 + r * (sizeH + gapY), w: sizeW, h: sizeH,
        facing: r % 2 === 0 ? 'up' : 'down', status: 'available' });
      n++;
    }
  }
  return seats;
}

function _buildFallbackFloor13() {
  const seats = [
    ..._cluster(220, 145, 4, 2, 'A'), ..._cluster(440, 145, 4, 2, 'B'),
    ..._cluster(660, 145, 4, 2, 'C'), ..._cluster(880, 145, 4, 2, 'D'),
    ..._cluster(220, 320, 4, 2, 'E'), ..._cluster(440, 320, 4, 2, 'F'),
    ..._cluster(660, 320, 4, 2, 'G'), ..._cluster(880, 320, 4, 2, 'H'),
    ..._cluster(220, 480, 3, 2, 'J'), ..._cluster(420, 480, 3, 2, 'K'),
    ..._cluster(640, 480, 3, 2, 'L'),
  ];
  // Mark some as occupied
  const rand = ((s) => { let x = s; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; })(42);
  const others = ['박서연','이도윤','최민지','정하늘','강예준','윤지우','한서영','오태경'];
  const teams = ['AI Platform','DevOps','Memory Arch','DRAM Design'];
  seats.forEach(s => {
    if (rand() < 0.5) { s.status = 'occupied'; s.occupant = { name: others[Math.floor(rand()*others.length)], team: teams[Math.floor(rand()*teams.length)] }; }
  });
  const mySeat = seats.find(s => s.id === 'C-03');
  if (mySeat) { mySeat.status = 'mine'; mySeat.occupant = { name: '김지훈', team: 'AI Platform' }; }

  return {
    id: 'doosan-13F', name: '13F · AI Platform', affiliation: 'SK하이닉스', viewBox: '0 0 1200 720',
    walls: [{ x: 40, y: 60, w: 1120, h: 600, kind: 'outer' }],
    zones: [
      { kind: 'core', x: 540, y: 215, w: 120, h: 90, label: '코어' },
      { kind: 'pantry', x: 980, y: 480, w: 160, h: 140, label: '팬트리' },
      { kind: 'lounge', x: 800, y: 480, w: 160, h: 140, label: '라운지' },
      { kind: 'reception', x: 540, y: 80, w: 120, h: 80, label: '리셉션' },
    ],
    rooms: [
      { id: 'mr-13a', name: 'Alpha', capacity: 10, x: 60, y: 80, w: 130, h: 100, kind: 'large', amenities: ['화면','화상회의','TV'] },
      { id: 'mr-13b', name: 'Beta', capacity: 6, x: 60, y: 200, w: 130, h: 90, kind: 'medium', amenities: ['화면','화상회의'] },
      { id: 'mr-13c', name: 'Gamma', capacity: 4, x: 60, y: 310, w: 130, h: 80, kind: 'small', amenities: ['화면'] },
      { id: 'mr-13d', name: 'Delta', capacity: 8, x: 1010, y: 80, w: 130, h: 100, kind: 'large', amenities: ['화면','화상회의'] },
      { id: 'mr-13e', name: 'Epsilon', capacity: 4, x: 1010, y: 200, w: 130, h: 90, kind: 'small', amenities: ['화면'] },
      { id: 'mr-13f', name: 'Zeta', capacity: 6, x: 1010, y: 310, w: 130, h: 90, kind: 'medium', amenities: ['화면','화상회의'] },
      { id: 'pb-13a', name: 'PB-1', capacity: 1, x: 200, y: 615, w: 56, h: 50, kind: 'booth' },
      { id: 'pb-13b', name: 'PB-2', capacity: 1, x: 264, y: 615, w: 56, h: 50, kind: 'booth' },
      { id: 'pb-13c', name: 'PB-3', capacity: 1, x: 328, y: 615, w: 56, h: 50, kind: 'booth' },
    ],
    seats,
  };
}

window.HS_FLOOR_13 = window.HS_FLOOR_13 || _buildFallbackFloor13();
window.HS_FLOORS_BY_ID = window.HS_FLOORS_BY_ID || { 'doosan-13F': window.HS_FLOOR_13 };

window.HS_MY_RESERVATIONS = window.HS_MY_RESERVATIONS || [
  { id: 'res-001', kind: 'seat', location: { campus: '분당캠퍼스', building: '두산타워', floor: '13F', spot: 'C-03' }, date: '2026-05-11', start: '09:00', end: '18:00', status: 'confirmed' },
  { id: 'res-002', kind: 'room', location: { campus: '분당캠퍼스', building: '두산타워', floor: '13F', spot: 'Alpha' }, date: '2026-05-11', start: '14:00', end: '15:30', status: 'confirmed', title: 'Sprint Planning', attendees: 6 },
  { id: 'res-003', kind: 'room', location: { campus: '분당캠퍼스', building: '두산타워', floor: '13F', spot: 'Beta' }, date: '2026-05-12', start: '10:00', end: '11:00', status: 'confirmed', title: '1:1 with 박서연', attendees: 2 },
];

window.HS_ROOM_BOOKINGS_13F = window.HS_ROOM_BOOKINGS_13F || {
  'mr-13a': [
    { start: '09:00', end: '10:00', title: '주간 회의', owner: '박서연', mine: false },
    { start: '14:00', end: '15:30', title: 'Sprint Planning', owner: '김지훈', mine: true },
  ],
  'mr-13b': [{ start: '10:00', end: '11:00', title: '1:1 with 박서연', owner: '김지훈', mine: true }],
  'mr-13c': [{ start: '11:00', end: '12:00', title: '코드 리뷰', owner: '최민지', mine: false }],
  'mr-13d': [{ start: '09:00', end: '11:00', title: '아키텍처 리뷰', owner: '강예준', mine: false }],
  'mr-13e': [{ start: '14:00', end: '15:00', title: '인터뷰', owner: '한서영', mine: false }],
  'mr-13f': [{ start: '10:30', end: '11:30', title: '제품 데모', owner: '오태경', mine: false }],
};

// ── Floor selector with affiliation lock ──────────────────────────────
function FloorSelector({ campus, building, floor, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  const user = window.HS_USER;
  const floors = building?.floors || [];
  return (
    <div className="anchor" ref={ref}>
      <button className="crumb" onClick={() => setOpen(!open)}>
        <I.Floor size={14} />
        <span className="crumb-label">층</span>
        <span>{floor.label}</span>
        <I.ChevD size={14} />
      </button>
      {open &&
      <div className="menu fadein">
        <div className="menu-sect">{building.name} · 층 선택</div>
        {floors.map((f) => {
          const canBook = user.bookableFloors.includes(f.id);
          const aff = window.HS_AFFILIATIONS[f.affiliation];
          return (
            <div key={f.id} className={`menu-item ${!canBook ? 'menu-item-locked' : ''}`}
              data-on={f.id === floor.id ? '1' : '0'}
              onClick={() => { onChange(f); setOpen(false); }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: aff?.color || '#888' }} />
              <span style={{ fontWeight: 500 }}>{f.label}</span>
              <span className="muted smaller">{f.desc}</span>
              <span className="menu-item-meta">
                {canBook ?
                  <span className="pill" data-color="primary" style={{ height: 20, fontSize: 10.5 }}>예약 가능</span> :
                  <span className="pill" data-color="muted" style={{ height: 20, fontSize: 10.5 }}><I.Eye size={11} /> 조회</span>
                }
              </span>
            </div>);
        })}
        <div className="menu-divider" />
        <div className="menu-item" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
          <I.Lock size={12} /> 권한이 없는 층은 조회만 가능합니다
        </div>
      </div>}
    </div>);
}

// ── Generic crumb dropdown ────────────────────────────────────────────
function CrumbMenu({ icon, label, value, items, onChange, getKey = (x) => x.id, getLabel = (x) => x.name, getMeta = () => null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  return (
    <div className="anchor" ref={ref}>
      <button className="crumb" onClick={() => setOpen(!open)}>
        {icon}
        <span className="crumb-label">{label}</span>
        <span>{getLabel(value)}</span>
        <I.ChevD size={14} />
      </button>
      {open &&
      <div className="menu fadein">
        {items.map((it) =>
          <div key={getKey(it)} className="menu-item"
            data-on={getKey(it) === getKey(value) ? '1' : '0'}
            onClick={() => { onChange(it); setOpen(false); }}>
            <span>{getLabel(it)}</span>
            {getMeta(it) && <span className="menu-item-meta">{getMeta(it)}</span>}
          </div>
        )}
      </div>}
    </div>);
}

// ── Date picker (calendar) ───────────────────────────────────────────
function DatePill({ date, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  const days = ['일','월','화','수','목','금','토'];
  const today = new Date(2026, 4, 10);
  const cur = new Date(date);
  const [viewMonth, setViewMonth] = useState(new Date(cur.getFullYear(), cur.getMonth(), 1));
  useEffect(() => { if (open) setViewMonth(new Date(cur.getFullYear(), cur.getMonth(), 1)); }, [open]);
  const pretty = (d) => {
    const t = new Date(d);
    const isToday = t.toDateString() === today.toDateString();
    const tom = new Date(today); tom.setDate(today.getDate() + 1);
    const isTom = t.toDateString() === tom.toDateString();
    if (isToday) return `오늘 · ${t.getMonth()+1}.${t.getDate()} (${days[t.getDay()]})`;
    if (isTom) return `내일 · ${t.getMonth()+1}.${t.getDate()} (${days[t.getDay()]})`;
    return `${t.getMonth()+1}.${t.getDate()} (${days[t.getDay()]})`;
  };
  const firstDow = viewMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  while (cells.length % 7) cells.push(null);
  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;
  const shift = (n) => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + n, 1));
  return (
    <div className="anchor" ref={ref}>
      <button className="crumb" onClick={() => setOpen(!open)}>
        <I.Cal size={14} /><span>{pretty(date)}</span><I.ChevD size={14} />
      </button>
      {open &&
      <div className="menu fadein" style={{ minWidth: 304, padding: 10 }}>
        <div className="row" style={{ gap: 6, padding: '2px 2px 8px' }}>
          <button className="btn btn-sm grow" onClick={() => { onChange('2026-05-10'); setOpen(false); }}>오늘</button>
          <button className="btn btn-sm grow" onClick={() => { onChange('2026-05-11'); setOpen(false); }}>내일</button>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', padding: '2px 4px 8px', borderTop: '1px solid var(--line)' }}>
          <button className="topbar-icon-btn" onClick={() => shift(-1)}><I.ChevD size={14} style={{ transform: 'rotate(90deg)' }} /></button>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{monthLabel}</div>
          <button className="topbar-icon-btn" onClick={() => shift(1)}><I.ChevR size={14} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 2px 4px' }}>
          {days.map((w, i) =>
            <div key={w} style={{ textAlign: 'center', fontSize: 10, color: i === 0 ? 'var(--danger)' : i === 6 ? 'var(--primary)' : 'var(--text-3)', padding: '4px 0', fontWeight: 500 }}>{w}</div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: 2 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const sel = d.toDateString() === new Date(date).toDateString();
            const isToday = d.toDateString() === today.toDateString();
            const dow = d.getDay();
            const past = d < new Date(today.toDateString());
            return (
              <button key={i} disabled={past}
                onClick={() => { const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; onChange(iso); setOpen(false); }}
                style={{ aspectRatio: '1', position: 'relative',
                  background: sel ? 'var(--primary)' : 'transparent',
                  color: sel ? '#fff' : past ? 'var(--text-3)' : dow === 0 ? 'var(--danger)' : 'var(--text)',
                  border: '1px solid ' + (sel ? 'var(--primary)' : 'transparent'),
                  borderRadius: 6, cursor: past ? 'not-allowed' : 'pointer',
                  fontWeight: isToday || sel ? 600 : 400, fontSize: 12, opacity: past ? .4 : 1 }}>
                {d.getDate()}
                {isToday && !sel && <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 4, background: 'var(--primary)' }} />}
              </button>);
          })}
        </div>
      </div>}
    </div>);
}

// ── Toast ────────────────────────────────────────────────────────────
function useToast() {
  const [t, setT] = useState(null);
  const show = (msg) => { setT(msg); setTimeout(() => setT(null), 2400); };
  const ui = t ? <div className="toast"><I.Check size={14} />{t}</div> : null;
  return [show, ui];
}

// ── Top + Sub bar ────────────────────────────────────────────────────
function TopBar({ title }) {
  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-grow" />
      <div className="avatar mobile-hide" style={{ width: 28, height: 28, fontSize: 11 }}>
        {window.HS_USER.name[0]}
      </div>
    </header>);
}

function SubBar({ campus, building, floor, date, onCampus, onBuilding, onFloor, onDate, extras }) {
  return (
    <div className="subbar">
      <div className="crumbs">
        <CrumbMenu icon={<I.Pin size={14} />} label="캠퍼스"
          value={campus} items={window.HS_CAMPUSES}
          onChange={(c) => { onCampus(c); onBuilding(c.buildings[0]); onFloor(c.buildings[0].floors[0]); }} />
        <span className="crumb-sep">/</span>
        <CrumbMenu icon={<I.Building size={14} />} label="건물"
          value={building} items={campus.buildings}
          onChange={(b) => { onBuilding(b); onFloor(b.floors[0]); }} />
        <span className="crumb-sep">/</span>
        <FloorSelector campus={campus} building={building} floor={floor} onChange={onFloor} />
      </div>
      <div className="topbar-grow" />
      {onDate && <DatePill date={date} onChange={onDate} />}
      {extras}
    </div>);
}

// ── Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ screen, onScreen, role }) {
  const items = role === 'admin' ?
    [{ id: 'admin-layout', label: 'Layout 편집기', icon: <I.Edit size={16} /> },
     { id: 'admin-users', label: '권한 관리', icon: <I.User size={16} /> },
     { id: 'admin-stats', label: '이용 현황', icon: <I.Grid size={16} /> }] :
    [{ id: 'mine', label: '내 예약', icon: <I.List size={16} />, badge: 3 },
     { id: 'seat', label: '좌석 예약', icon: <I.Seat size={16} /> },
     { id: 'room', label: '회의실 예약', icon: <I.Room size={16} /> }];
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <I.Logo size={28} />
        <div><div className="sb-brand-name">HySpace</div><div className="sb-brand-sub">분당 · 두산타워</div></div>
      </div>
      <nav className="sb-nav">
        <div className="sb-section">{role === 'admin' ? '관리자' : '예약'}</div>
        {items.map((it) =>
          <button key={it.id} className="sb-link" data-on={screen === it.id ? '1' : '0'} onClick={() => onScreen(it.id)}>
            {it.icon}<span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </button>
        )}
        <div className="sb-section">바로가기</div>
        <button className="sb-link"><I.Clock size={16} /><span>최근 사용 좌석</span></button>
        <button className="sb-link"><I.Pin size={16} /><span>즐겨찾기</span></button>
        <div style={{ flex: 1 }} />
        <div className="sb-section">{role === 'admin' ? '뷰 전환' : '관리'}</div>
        {role === 'admin' ?
          <button className="sb-link" onClick={() => onScreen('seat')}><I.Eye size={16} /><span>사용자 화면 보기</span></button> :
          <button className="sb-link" onClick={() => onScreen('admin-layout')}><I.Settings size={16} /><span>관리자 모드</span></button>
        }
      </nav>
      <div className="sb-user">
        <div className="avatar">{window.HS_USER.name[0]}</div>
        <div className="sb-user-info truncate">
          <div className="sb-user-name truncate">{window.HS_USER.name}</div>
          <div className="sb-user-aff truncate">{window.HS_USER.affiliation}</div>
        </div>
      </div>
    </aside>);
}

// ── Mobile bottom tabs ───────────────────────────────────────────────
function MobileTabs({ screen, onScreen, role }) {
  if (role === 'admin') {
    return (
      <nav className="mobile-tabs">
        <button data-on={screen === 'admin-layout' ? '1' : '0'} onClick={() => onScreen('admin-layout')}><I.Edit size={20} /><span>Layout</span></button>
        <button data-on={screen === 'admin-users' ? '1' : '0'} onClick={() => onScreen('admin-users')}><I.User size={20} /><span>권한</span></button>
        <button data-on={screen === 'admin-stats' ? '1' : '0'} onClick={() => onScreen('admin-stats')}><I.Grid size={20} /><span>현황</span></button>
        <button onClick={() => onScreen('seat')}><I.Eye size={20} /><span>사용자뷰</span></button>
      </nav>);
  }
  return (
    <nav className="mobile-tabs">
      <button data-on={screen === 'mine' ? '1' : '0'} onClick={() => onScreen('mine')}><I.List size={20} /><span>내 예약</span></button>
      <button data-on={screen === 'seat' ? '1' : '0'} onClick={() => onScreen('seat')}><I.Seat size={20} /><span>좌석</span></button>
      <button data-on={screen === 'room' ? '1' : '0'} onClick={() => onScreen('room')}><I.Room size={20} /><span>회의실</span></button>
      <button onClick={() => onScreen('admin-layout')}><I.Settings size={20} /><span>관리</span></button>
    </nav>);
}

// ── App ──────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState('seat');
  const [campus, setCampus] = useState(window.HS_CAMPUSES[0]);
  const [building, setBuilding] = useState(window.HS_CAMPUSES[0].buildings[0]);
  const [floor, setFloor] = useState(window.HS_CAMPUSES[0].buildings[0].floors.find((f) => f.id === '13F'));
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [showToast, toastUI] = useToast();
  const [loading, setLoading] = useState(true);
  const [floorData, setFloorData] = useState(window.HS_FLOOR_13);
  const [apiReady, setApiReady] = useState(false);

  // ── Load initial data from API on mount ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Load user
        const user = await HySpaceAPI.getMe();
        if (user && user.id) {
          window.HS_USER = user;
          // Derive bookableFloors from affiliations
          const affs = await HySpaceAPI.getAffiliations();
          if (affs && affs.length) {
            const affMap = {};
            affs.forEach(a => { affMap[a.name] = { color: a.color, floors: a.bookable_floors || [] }; });
            window.HS_AFFILIATIONS = affMap;
            const myAff = affs.find(a => a.name === user.affiliation);
            if (myAff) window.HS_USER.bookableFloors = myAff.bookable_floors || [];
          }
          setApiReady(true);
        }

        // Load campuses
        const campuses = await HySpaceAPI.getCampuses();
        if (campuses && campuses.length) {
          // Transform API response to match UI expectations
          const transformed = campuses.map(c => ({
            ...c,
            buildings: (c.buildings || []).map(b => ({
              ...b,
              floors: (b.floors || []).map(f => ({
                id: f.label,
                label: f.label,
                affiliation: f.affiliation,
                desc: f.description || '',
                _apiId: f.id, // real DB id for API calls
              })),
            })),
          }));
          window.HS_CAMPUSES = transformed;
          setCampus(transformed[0]);
          setBuilding(transformed[0].buildings[0]);
          const defaultFloor = transformed[0].buildings[0].floors.find(f => f.label === '13F') || transformed[0].buildings[0].floors[0];
          setFloor(defaultFloor);
        }
      } catch (e) {
        console.warn('API unavailable, using fallback data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Load floor data from API when building/floor changes ────────────
  useEffect(() => {
    if (!floor) return;
    const floorApiId = floor._apiId || `${building.id}-${floor.id}`;
    (async () => {
      const data = await HySpaceAPI.getFloor(floorApiId);
      if (data && data.seats) {
        // Transform API seats to have status (available by default)
        const seats = data.seats.map(s => ({ ...s, status: 'available' }));
        const floorObj = {
          id: data.id,
          name: data.name,
          affiliation: data.affiliation,
          viewBox: data.view_box || '0 0 1200 720',
          walls: [{ x: 40, y: 60, w: 1120, h: 600, kind: 'outer' }],
          seats,
          rooms: data.rooms || [],
          zones: data.zones || [],
        };
        setFloorData(floorObj);
      } else {
        // Fallback to static
        const key = `${building.id}-${floor.id}`;
        setFloorData(window.HS_FLOORS_BY_ID[key] || window.HS_FLOOR_13);
      }
    })();
  }, [building?.id, floor?.id, floor?._apiId]);

  // ── Load reservations and mark seat status ──────────────────────────
  useEffect(() => {
    if (!floor || !apiReady) return;
    const floorApiId = floor._apiId || `${building.id}-${floor.id}`;
    (async () => {
      const reservations = await HySpaceAPI.getReservations(floorApiId, date);
      if (reservations && reservations.length && floorData) {
        setFloorData(prev => {
          if (!prev || !prev.seats) return prev;
          const seatReservations = reservations.filter(r => r.kind === 'seat' && r.status === 'confirmed');
          const updatedSeats = prev.seats.map(s => {
            const res = seatReservations.find(r => r.target_id === s.id || r.target_id === s.label);
            if (res) {
              if (res.user_id === window.HS_USER.id) {
                return { ...s, status: 'mine', occupant: { name: window.HS_USER.name, team: window.HS_USER.team } };
              }
              return { ...s, status: 'occupied', occupant: { name: '예약됨', team: '' } };
            }
            return { ...s, status: 'available' };
          });
          // Build room bookings for the time grid
          const roomReservations = reservations.filter(r => r.kind === 'room' && r.status === 'confirmed');
          const roomBookings = {};
          roomReservations.forEach(r => {
            if (!roomBookings[r.target_id]) roomBookings[r.target_id] = [];
            roomBookings[r.target_id].push({
              start: r.start_time,
              end: r.end_time,
              title: r.title || '예약',
              owner: r.user_id === window.HS_USER.id ? window.HS_USER.name : '다른 사용자',
              mine: r.user_id === window.HS_USER.id,
            });
          });
          window.HS_ROOM_BOOKINGS_13F = roomBookings;
          return { ...prev, seats: updatedSeats };
        });
      }
    })();
  }, [floor?.id, floor?._apiId, date, apiReady]);

  // Store current date globally for child components
  window.__currentDate = date;

  const role = screen.startsWith('admin-') ? 'admin' : 'user';

  const titles = {
    seat: '좌석 예약', room: '회의실 예약', mine: '내 예약',
    'admin-layout': 'Layout 편집기', 'admin-users': '권한 관리', 'admin-stats': '이용 현황',
  };

  const showSubbar = ['seat', 'room', 'admin-layout'].includes(screen);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', fontFamily: 'var(--font-sans)' }}>
        <div className="col" style={{ alignItems: 'center', gap: 12 }}>
          <I.Logo size={48} />
          <div style={{ fontWeight: 600, fontSize: 16 }}>HySpace</div>
          <div className="muted small">데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case 'seat':
        return <SeatBookingScreen floor={floorData} floorMeta={floor} date={date}
          interaction="modal" onBook={(msg) => showToast(msg)} />;
      case 'room':
        return <RoomBookingScreen floor={floorData} floorMeta={floor} date={date}
          dense={false} onBook={(msg) => showToast(msg)} />;
      case 'mine':
        return <MyReservationsScreen onCancel={(msg) => showToast(msg)} />;
      case 'admin-layout':
        return <AdminLayoutScreen floor={floorData} floorMeta={floor} onSave={(msg) => showToast(msg)} />;
      case 'admin-users':
        return <AdminUsersScreen />;
      case 'admin-stats':
        return <AdminStatsScreen floor={floorData} />;
      default: return null;
    }
  };

  return (
    <div className="app" data-layout="sidebar">
      <Sidebar screen={screen} onScreen={setScreen} role={role} />
      <div className="main">
        <TopBar title={titles[screen]} />
        {showSubbar &&
          <SubBar campus={campus} building={building} floor={floor} date={date}
            onCampus={setCampus} onBuilding={setBuilding} onFloor={setFloor}
            onDate={['seat', 'room'].includes(screen) ? setDate : null}
            extras={role === 'admin' ? null :
              <span className="pill" data-color={
                window.HS_AFFILIATIONS[floor.affiliation]?.color === '#2A5BD7' ? 'primary' :
                window.HS_AFFILIATIONS[floor.affiliation]?.color === '#7A5AE0' ? 'ax' : 'muted'
              }>
                {window.HS_USER.bookableFloors.includes(floor.id) ? null : <I.Eye size={12} />}
                {floor.affiliation} 영역
              </span>
            } />
        }
        <main className="content fadein" key={screen + floor?.id}>
          {renderScreen()}
        </main>
      </div>
      <MobileTabs screen={screen} onScreen={setScreen} role={role} />
      {toastUI}
    </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
