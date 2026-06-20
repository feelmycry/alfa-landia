// ============================================================
// GAME MECHANICS
// ============================================================

function getQuestionsForUser(productId, role) {
  const pool = QUESTIONS[productId];
  const levelSeq = ROLES[role].levels;
  const used = { easy: 0, medium: 0, hard: 0 };
  return levelSeq.map(lvl => {
    const arr = pool[lvl];
    const idx = used[lvl] % arr.length;
    used[lvl]++;
    return { ...arr[idx], difficulty: lvl };
  });
}

function calcMaxScore(questions) {
  return questions.reduce((s, q) => s + q.points, 0);
}

function calcPassThreshold(questions) {
  return Math.ceil(calcMaxScore(questions) * 0.6);
}

function getAvailableMoves(user) {
  const div = DIVISIONS[user.position];
  return div.neighbors.filter(n => !user.visitedDivisions.includes(n));
}

function canMove(user) {
  // Must have passed the current division's quiz
  const quiz = user.completedQuizzes[user.position];
  return quiz && quiz.passed;
}

function moveTo(user, divId) {
  if (!DIVISIONS[divId]) return user;
  user.position = divId;
  if (!user.visitedDivisions.includes(divId)) {
    user.visitedDivisions.push(divId);
  }
  saveUser(user);
  return user;
}

function recordQuizResult(user, divId, score, maxScore, passed) {
  user.completedQuizzes[divId] = {
    score, maxScore, passed,
    date: new Date().toISOString()
  };
  if (passed) {
    const pts = score + (score === maxScore ? 50 : 0); // perfect bonus
    user.points = (user.points || 0) + pts;
    user.xp = (user.xp || 0) + pts;
    // Level up every 200 xp
    user.level = Math.floor(user.xp / 200) + 1;
  }
  // Award badges
  checkBadges(user, divId, score, maxScore);
  saveUser(user);
  return user;
}

function checkBadges(user, divId, score, maxScore) {
  const add = id => { if (!user.badges.includes(id)) user.badges.push(id); };

  // First quiz ever
  if (Object.keys(user.completedQuizzes).length >= 1) add('first_quiz');

  // Perfect score
  if (score === maxScore) add('perfect_score');

  // Product mastery — check if this product is now completed
  const product = DIVISIONS[divId].product;
  // All divisions for this product visited & passed
  const allForProduct = Object.values(DIVISIONS).filter(d => d.product === product);
  const allPassed = allForProduct.every(d => user.completedQuizzes[d.id]?.passed);
  if (allPassed && PRODUCT_BADGES[product]) add(PRODUCT_BADGES[product]);

  // Map milestones
  const visited = user.visitedDivisions.length;
  if (visited >= 4) add('half_map');
  if (visited >= 8) add('full_map');

  // Streak badges (daily challenge streak)
  const dailyStreak = (user.daily || {}).streak || 0;
  if (dailyStreak >= 3) add('streak_3');
  if (dailyStreak >= 7) add('streak_7');
}

function isGameComplete(user) {
  return user.visitedDivisions.length >= Object.keys(DIVISIONS).length &&
    Object.keys(user.completedQuizzes).length >= Object.keys(DIVISIONS).length &&
    Object.values(user.completedQuizzes).every(q => q.passed);
}

// Leaderboard helpers
function getDivisionLeaderboard(divId) {
  return getAllUsers()
    .filter(u => u.division === divId)
    .sort((a, b) => (b.points || 0) - (a.points || 0));
}
function getGlobalLeaderboard() {
  return getAllUsers().sort((a, b) => (b.points || 0) - (a.points || 0));
}
