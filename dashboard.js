'use strict';
const byId = id => document.getElementById(id);
const state = { snapshot: null, selectedRoom: 'basgall' };
const roomNames = { basgall: 'Basgall', bissing: 'Bissing', tearose: 'Tea Rose' };
const format = value => {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Unknown';
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
};
function put(id, value, className) {
  const element = byId(id);
  element.textContent = value;
  if (className !== undefined) element.className = className;
}
function indicator(prefix, value, yes = 'Passing', no = 'Needs attention', unknown = 'Not tested') {
  const name = value === true ? yes : value === false ? no : unknown;
  const kind = value === true ? 'good' : value === false ? 'bad' : 'warn';
  put(prefix + '-state', name, 'stat-value ' + kind);
}
function checkRow(label, description, value, unknown = 'Unverified') {
  const row = document.createElement('div');
  row.className = 'check-row';
  const left = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'check-title';
  title.textContent = label;
  const note = document.createElement('div');
  note.className = 'check-note';
  note.textContent = description;
  left.append(title, note);
  const right = document.createElement('div');
  right.className = 'check-status ' + (value === true ? 'good' : value === false ? 'bad' : 'warn');
  right.textContent = value === true ? 'Passing' : value === false ? 'Review' : unknown;
  row.append(left, right);
  return row;
}
function problems(snapshot) {
  const messages = [];
  const h = snapshot.host || {};
  if (h.wifi === false) messages.push('Omarchy is not on its expected guest network configuration.');
  if (h.gateway === false) messages.push('Guest network gateway did not respond.');
  if (h.remote === false) messages.push('Guest Roku remote service did not pass.');
  if (h.phone === false) messages.push('Motorola could not reach the local checker.');
  if (h.dhcp !== true) messages.push('Router DHCP reservations remain unverified.');
  const names = ['basgall', 'bissing', 'tearose'];
  const details = [['roku','Roku connection'],['identity','Roku identity'],['remote','guest remote'],['breakfast','breakfast menu'],['qr','saved QR artwork']];
  for (const id of names) {
    const room = snapshot.rooms?.[id] || {};
    for (const [field, description] of details) {
      if (room[field] === false) messages.push(roomNames[id] + ': ' + description + ' needs review.');
    }
  }
  return messages;
}
function renderRoom() {
  const room = state.snapshot?.rooms?.[state.selectedRoom];
  put('room-name', roomNames[state.selectedRoom]);
  const checks = byId('room-checks');
  checks.replaceChildren();
  if (!room) {
    put('room-health', 'Not available', 'room-health warn');
    return;
  }
  const fields = ['roku','identity','remote','breakfast','qr'];
  const isComplete = fields.every(key => room[key] === true);
  put('room-health', isComplete ? 'Checks passing' : 'Review needed', 'room-health ' + (isComplete ? 'good' : 'warn'));
  checks.append(
    checkRow('Roku connection', 'Expected Roku responds to the local network probe', room.roku),
    checkRow('Device identity', 'Hardware identity matches the assigned room', room.identity),
    checkRow('Guest phone remote', 'Room-specific guest remote health test', room.remote),
    checkRow('Breakfast menu', 'Hosted room menu loads; orders and database writes not tested', room.breakfast),
    checkRow('Saved backdrop & QR codes', 'Two QR codes checked against room-specific links', room.qr),
    checkRow('Backdrop currently on TV', 'Not measurable from the local image scan', null)
  );
}
function render() {
  const snapshot = state.snapshot;
  if (!snapshot) return;
  const h = snapshot.host || {};
  indicator('wifi', h.wifi, 'Connected', 'Needs attention');
  put('wifi-detail', 'Expected network configuration');
  indicator('gateway', h.gateway, 'Reachable', 'Unreachable');
  put('gateway-detail', 'Guest network connectivity');
  indicator('remote', h.remote, 'Running', 'Stopped');
  put('remote-detail', 'Omarchy remote service');
  indicator('phone', h.phone, 'Reachable', 'Blocked', 'Not tested');
  put('phone-detail', 'Test requires wireless ADB connection');
  const rokucount = ['basgall','bissing','tearose'].filter(id => snapshot.rooms?.[id]?.roku === true).length;
  put('rokus-state', rokucount + ' / 3 online', 'stat-value ' + (rokucount === 3 ? 'good' : 'bad'));
  put('rokus-detail', 'Expected room device verified separately');
  indicator('dhcp', h.dhcp === true ? true : null, 'Confirmed', 'Needs review', 'Not confirmed');
  put('dhcp-detail', 'Router reservations require manual verification');
  put('checked-at', 'Measured ' + format(snapshot.checkedAt));
  const age = Date.now() - Date.parse(snapshot.publishedAt || '');
  const stale = !Number.isFinite(age) || age < -120000 || age > 30 * 60 * 1000;
  put('message', stale
    ? 'STALE SNAPSHOT — Omarchy has not published an update recently. Values below are last known and may have changed.'
    : 'Last published ' + format(snapshot.publishedAt) + '. Automatic checks occur locally; this page refreshes the published snapshot.',
    stale ? 'notice is-stale' : 'notice good');
  const issues = problems(snapshot);
  put('issue-count', String(issues.length));
  const list = byId('findings-list');
  list.replaceChildren();
  if (!issues.length) issues.push('No problems found in the published tests. Live backdrop status is still unverified.');
  for (const item of issues) {
    const li = document.createElement('li');
    li.textContent = item;
    list.append(li);
  }
  renderRoom();
}
async function refresh() {
  const btn = byId('refresh');
  btn.disabled = true;
  btn.textContent = 'Refreshing…';
  try {
    const response = await fetch('./status.json?at=' + Date.now(), { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw Error('Status file is not yet available.');
    const data = await response.json();
    if (data.version !== 1 || !data.rooms || !data.host) throw Error('Unrecognized status format.');
    state.snapshot = data;
    render();
  } catch (error) {
    put('message', 'Could not load the published snapshot: ' + error.message + '. Live network checks remain on Omarchy.', 'notice bad');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Refresh status';
  }
}
byId('room-select').addEventListener('change', event => {
  state.selectedRoom = event.target.value;
  renderRoom();
});
byId('refresh').addEventListener('click', refresh);
refresh();
setInterval(refresh, 60000);
