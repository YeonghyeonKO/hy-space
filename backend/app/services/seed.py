from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campus import Campus, Building, Floor
from app.models.seat import Seat
from app.models.room import Room
from app.models.zone import Zone
from app.models.user import User, Affiliation
from app.models.reservation import Reservation


def _cluster(cx, cy, cols, rows, prefix, size_w=36, size_h=32, gap_x=6, gap_y=16):
    seats = []
    n = 1
    total_w = cols * size_w + (cols - 1) * gap_x
    total_h = rows * size_h + (rows - 1) * gap_y
    x0 = cx - total_w / 2
    y0 = cy - total_h / 2
    for r in range(rows):
        for c in range(cols):
            seats.append({
                "label": f"{prefix}{n}",
                "x": x0 + c * (size_w + gap_x),
                "y": y0 + r * (size_h + gap_y),
                "w": size_w,
                "h": size_h,
                "facing": "up" if r % 2 == 0 else "down",
                "group_name": prefix,
            })
            n += 1
    return seats


async def seed_database(db: AsyncSession):
    # Check if already seeded
    result = await db.execute(select(Campus).limit(1))
    if result.scalar_one_or_none():
        return

    # Affiliations
    aff_hynix = Affiliation(name="SK하이닉스", color="#2A5BD7", bookable_floors=["5F", "12F", "13F", "14F", "15F"])
    aff_ax = Affiliation(name="SK AX", color="#7A5AE0", bookable_floors=["8F", "9F", "10F", "11F"])
    aff_partner = Affiliation(name="협력사", color="#8B92A0", bookable_floors=[])
    db.add_all([aff_hynix, aff_ax, aff_partner])

    # User
    user = User(
        name="김지훈",
        email="jihoon.kim@skhynix.com",
        affiliation="SK하이닉스",
        team="AI Platform / DevOps",
    )
    db.add(user)

    # Campuses
    bundang = Campus(id="bundang", name="분당캠퍼스", address="경기 성남시 분당구")
    icheon = Campus(id="icheon", name="이천캠퍼스", address="경기 이천시")
    cheongju = Campus(id="cheongju", name="청주캠퍼스", address="충북 청주시")
    db.add_all([bundang, icheon, cheongju])

    # Buildings
    doosan = Building(id="doosan", campus_id="bundang", name="두산타워")
    rnd = Building(id="rnd", campus_id="bundang", name="R&D센터")
    icheon_main = Building(id="icheon-main", campus_id="icheon", name="본관")
    cheongju_main = Building(id="cheongju-main", campus_id="cheongju", name="본관")
    db.add_all([doosan, rnd, icheon_main, cheongju_main])

    # Floors — 두산타워
    floors_data = [
        ("doosan-5F", "doosan", "5F", "SK하이닉스", "디자인/리서치"),
        ("doosan-8F", "doosan", "8F", "SK AX", "Cloud Engineering"),
        ("doosan-9F", "doosan", "9F", "SK AX", "Data & ML"),
        ("doosan-10F", "doosan", "10F", "SK AX", "Solution Sales"),
        ("doosan-11F", "doosan", "11F", "SK AX", "Consulting"),
        ("doosan-12F", "doosan", "12F", "SK하이닉스", "Memory Architecture"),
        ("doosan-13F", "doosan", "13F", "SK하이닉스", "AI Platform"),
        ("doosan-14F", "doosan", "14F", "SK하이닉스", "DRAM Design"),
        ("doosan-15F", "doosan", "15F", "SK하이닉스", "Executive"),
    ]
    for fid, bid, label, aff, desc in floors_data:
        db.add(Floor(id=fid, building_id=bid, label=label, affiliation=aff, description=desc))

    # Floors — R&D센터
    for fid, label, desc in [("rnd-5F", "5F", "Lab A"), ("rnd-12F", "12F", "Lab B"), ("rnd-13F", "13F", "Lab C")]:
        db.add(Floor(id=fid, building_id="rnd", label=label, affiliation="SK하이닉스", description=desc))

    # Floors — 이천
    for fid, label, desc in [("icheon-5F", "5F", "Fab Engineering"), ("icheon-12F", "12F", "Process Tech")]:
        db.add(Floor(id=fid, building_id="icheon-main", label=label, affiliation="SK하이닉스", description=desc))

    # Floors — 청주
    db.add(Floor(id="cheongju-13F", building_id="cheongju-main", label="13F", affiliation="SK하이닉스", description="NAND R&D"))

    await db.flush()

    # Floor 13 seats (clusters A-L, ~110 seats)
    floor_13_id = "doosan-13F"
    all_seats = []
    # Top row: 4 clusters of 8 (4×2)
    all_seats.extend(_cluster(220, 145, 4, 2, "A"))
    all_seats.extend(_cluster(440, 145, 4, 2, "B"))
    all_seats.extend(_cluster(660, 145, 4, 2, "C"))
    all_seats.extend(_cluster(880, 145, 4, 2, "D"))
    # Middle row: 4 clusters of 8 (4×2)
    all_seats.extend(_cluster(220, 320, 4, 2, "E"))
    all_seats.extend(_cluster(440, 320, 4, 2, "F"))
    all_seats.extend(_cluster(660, 320, 4, 2, "G"))
    all_seats.extend(_cluster(880, 320, 4, 2, "H"))
    # Bottom row: 3 clusters of 6 (3×2)
    all_seats.extend(_cluster(220, 480, 3, 2, "J"))
    all_seats.extend(_cluster(420, 480, 3, 2, "K"))
    all_seats.extend(_cluster(640, 480, 3, 2, "L"))

    for s in all_seats:
        db.add(Seat(floor_id=floor_13_id, **s))

    # Floor 13 rooms
    rooms_13 = [
        {"name": "Alpha", "capacity": 10, "x": 60, "y": 80, "w": 130, "h": 100, "kind": "large", "amenities": ["화면", "화상회의", "TV"]},
        {"name": "Beta", "capacity": 6, "x": 60, "y": 200, "w": 130, "h": 90, "kind": "medium", "amenities": ["화면", "화상회의"]},
        {"name": "Gamma", "capacity": 4, "x": 60, "y": 310, "w": 130, "h": 80, "kind": "small", "amenities": ["화면"]},
        {"name": "Delta", "capacity": 8, "x": 1010, "y": 80, "w": 130, "h": 100, "kind": "large", "amenities": ["화면", "화상회의"]},
        {"name": "Epsilon", "capacity": 4, "x": 1010, "y": 200, "w": 130, "h": 90, "kind": "small", "amenities": ["화면"]},
        {"name": "Zeta", "capacity": 6, "x": 1010, "y": 310, "w": 130, "h": 90, "kind": "medium", "amenities": ["화면", "화상회의"]},
        {"name": "PB-1", "capacity": 1, "x": 200, "y": 615, "w": 56, "h": 50, "kind": "booth", "amenities": []},
        {"name": "PB-2", "capacity": 1, "x": 264, "y": 615, "w": 56, "h": 50, "kind": "booth", "amenities": []},
        {"name": "PB-3", "capacity": 1, "x": 328, "y": 615, "w": 56, "h": 50, "kind": "booth", "amenities": []},
    ]
    for r in rooms_13:
        db.add(Room(floor_id=floor_13_id, **r))

    # Floor 13 zones
    zones_13 = [
        {"kind": "core", "label": "코어", "x": 540, "y": 215, "w": 120, "h": 90},
        {"kind": "pantry", "label": "팬트리", "x": 980, "y": 480, "w": 160, "h": 140},
        {"kind": "lounge", "label": "라운지", "x": 800, "y": 480, "w": 160, "h": 140},
        {"kind": "reception", "label": "리셉션", "x": 540, "y": 80, "w": 120, "h": 80},
    ]
    for z in zones_13:
        db.add(Zone(floor_id=floor_13_id, **z))

    # Floor 14 seats
    floor_14_id = "doosan-14F"
    f14_seats = []
    f14_seats.extend(_cluster(280, 200, 4, 2, "A"))
    f14_seats.extend(_cluster(540, 200, 4, 2, "B"))
    f14_seats.extend(_cluster(800, 200, 4, 2, "C"))
    f14_seats.extend(_cluster(280, 400, 4, 2, "D"))
    f14_seats.extend(_cluster(540, 400, 4, 2, "E"))
    f14_seats.extend(_cluster(800, 400, 4, 2, "F"))
    for s in f14_seats:
        db.add(Seat(floor_id=floor_14_id, **s))

    rooms_14 = [
        {"name": "Atlas", "capacity": 12, "x": 60, "y": 80, "w": 160, "h": 110, "kind": "large", "amenities": ["화면", "화상회의", "TV"]},
        {"name": "Bridge", "capacity": 6, "x": 60, "y": 540, "w": 160, "h": 90, "kind": "medium", "amenities": ["화면"]},
        {"name": "Crest", "capacity": 4, "x": 1000, "y": 80, "w": 140, "h": 90, "kind": "small", "amenities": ["화면"]},
        {"name": "Drift", "capacity": 8, "x": 1000, "y": 200, "w": 140, "h": 100, "kind": "large", "amenities": ["화면", "화상회의"]},
    ]
    for r in rooms_14:
        db.add(Room(floor_id=floor_14_id, **r))
    db.add(Zone(floor_id=floor_14_id, kind="core", label="코어", x=540, y=290, w=120, h=90))
    db.add(Zone(floor_id=floor_14_id, kind="pantry", label="팬트리", x=1000, y=530, w=140, h=90))

    # Sample reservations
    await db.flush()
    user_result = await db.execute(select(User).limit(1))
    u = user_result.scalar_one()

    from datetime import date
    reservations = [
        Reservation(user_id=u.id, kind="seat", target_id="C3", floor_id=floor_13_id, date=date(2026, 5, 11), start_time="09:00", end_time="18:00", status="confirmed"),
        Reservation(user_id=u.id, kind="room", target_id="Alpha", floor_id=floor_13_id, date=date(2026, 5, 11), start_time="14:00", end_time="15:30", title="Sprint Planning", attendees=6, status="confirmed"),
        Reservation(user_id=u.id, kind="room", target_id="Beta", floor_id=floor_13_id, date=date(2026, 5, 12), start_time="10:00", end_time="11:00", title="1:1 with 박서연", attendees=2, status="confirmed"),
        Reservation(user_id=u.id, kind="seat", target_id="C3", floor_id=floor_13_id, date=date(2026, 5, 12), start_time="09:00", end_time="18:00", status="confirmed"),
    ]
    db.add_all(reservations)

    await db.commit()
