// HySpace API client
window.HySpaceAPI = {
  async getCampuses() {
    try {
      const r = await fetch('/api/v1/campuses');
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  },
  async getFloor(floorId) {
    try {
      const r = await fetch('/api/v1/floors/' + floorId);
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  },
  async getReservations(floorId, date) {
    try {
      const r = await fetch('/api/v1/reservations?floor_id=' + floorId + '&date=' + date);
      if (!r.ok) return [];
      return r.json();
    } catch { return []; }
  },
  async getMyReservations() {
    try {
      const r = await fetch('/api/v1/reservations/my');
      if (!r.ok) return [];
      return r.json();
    } catch { return []; }
  },
  async createReservation(data) {
    try {
      const r = await fetch('/api/v1/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return r.json();
    } catch { return null; }
  },
  async cancelReservation(id) {
    try {
      const r = await fetch('/api/v1/reservations/' + id, { method: 'DELETE' });
      return r.json();
    } catch { return null; }
  },
  async getMe() {
    try {
      const r = await fetch('/api/v1/users/me');
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  },
  async getAffiliations() {
    try {
      const r = await fetch('/api/v1/affiliations');
      if (!r.ok) return [];
      return r.json();
    } catch { return []; }
  },
  async saveLayout(floorId, data) {
    try {
      const r = await fetch('/api/v1/floors/' + floorId + '/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return r.json();
    } catch { return null; }
  },
  async getStats(floorId) {
    try {
      const r = await fetch('/api/v1/admin/stats/' + floorId);
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  },
  async seed() {
    try {
      const r = await fetch('/api/v1/seed', { method: 'POST' });
      return r.json();
    } catch { return null; }
  },
};
