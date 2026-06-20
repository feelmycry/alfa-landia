// ============================================================
// AUTH — localStorage-based user management
// ============================================================

const DB_KEY = 'alfa_landia_users';
const SESSION_KEY = 'alfa_landia_session';

function getUsers() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
}
function saveUsers(users) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}
function getCurrentUser() {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const users = getUsers();
  return users[id] || null;
}
function setCurrentUser(user) {
  const users = getUsers();
  users[user.id] = user;
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, user.id);
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}
function requireAuth() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return null; }
  return user;
}
function saveUser(user) {
  const users = getUsers();
  users[user.id] = user;
  saveUsers(users);
}
function getAllUsers() {
  return Object.values(getUsers());
}

// Called on registration
function createUser(data) {
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
  const user = {
    id,
    name: data.name,
    office: data.office,
    division: data.division,
    region: data.region,
    role: data.role,
    homeDivision: data.division,
    position: data.division,           // current position on map
    visitedDivisions: [data.division], // started at home
    completedQuizzes: {},              // { DIVID: { score, maxScore, date, passed } }
    points: 0,
    badges: [],
    streak: 0,
    lastLoginDate: null,
    level: 1,
    xp: 0,
    createdAt: new Date().toISOString()
  };
  setCurrentUser(user);
  return user;
}

// Streak update on login
function updateStreak(user) {
  const today = new Date().toDateString();
  if (user.lastLoginDate === today) return user;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (user.lastLoginDate === yesterday) {
    user.streak = (user.streak || 0) + 1;
  } else {
    user.streak = 1;
  }
  user.lastLoginDate = today;
  saveUser(user);
  return user;
}
