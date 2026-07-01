// ---- 1. CONNECT YOUR SUPABASE PROJECT ----
// Replace these two values with your own project's URL and anon public key.
// Find them in Supabase: Project Settings -> API.
const SUPABASE_URL = "https://sazapcvjnszudgacyxes.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_WLFClFLy-naog6lXmKzD1Q_wUpSwsDs";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- 2. MATCHES ----
// Add every match here before the tournament starts.
// Once a match finishes, fill in "result" with the real score, then commit and push.
// The leaderboard recalculates automatically once a result is filled in.
const matches = [
  {
    id: "m1",
    home: "Mexico",
    away: "USA",
    kickoff: "Jun 11, 2026",
    result: null // e.g. { home: 2, away: 1 }
  },
  {
    id: "m2",
    home: "Canada",
    away: "Argentina",
    kickoff: "Jun 12, 2026",
    result: null
  },
  {
    id: "m3",
    home: "Brazil",
    away: "France",
    kickoff: "Jun 13, 2026",
    result: null
  }
];

// ---- 3. RENDER MATCH CARDS ----
const matchListEl = document.getElementById("matchList");

matches.forEach((m) => {
  const card = document.createElement("div");
  card.className = "match-card";
  card.innerHTML = `
    <div class="match-teams">
      <span class="fixture">${m.home} vs ${m.away}</span>
      <span class="kickoff">${m.kickoff}</span>
    </div>
    <div class="match-score">
      <input type="number" min="0" max="20" id="${m.id}-home" placeholder="0" aria-label="${m.home} score">
      <span>–</span>
      <input type="number" min="0" max="20" id="${m.id}-away" placeholder="0" aria-label="${m.away} score">
    </div>
  `;
  matchListEl.appendChild(card);
});

// ---- 4. SUBMIT PREDICTIONS ----
const submitBtn = document.getElementById("submitAll");
const statusEl = document.getElementById("submitStatus");

submitBtn.addEventListener("click", async () => {
  const name = document.getElementById("playerName").value.trim();
  if (!name) {
    statusEl.textContent = "Enter a name before submitting.";
    statusEl.style.color = "#e2a04a";
    return;
  }

  const rows = [];
  for (const m of matches) {
    const homeVal = document.getElementById(`${m.id}-home`).value;
    const awayVal = document.getElementById(`${m.id}-away`).value;
    if (homeVal === "" || awayVal === "") {
      statusEl.textContent = `Fill in a score for ${m.home} vs ${m.away}.`;
      statusEl.style.color = "#e2a04a";
      return;
    }
    rows.push({
      player_name: name,
      match_id: m.id,
      home_score: parseInt(homeVal, 10),
      away_score: parseInt(awayVal, 10)
    });
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  const { error } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "player_name,match_id" });

  submitBtn.disabled = false;
  submitBtn.textContent = "Submit predictions";

  if (error) {
    statusEl.textContent = "Something went wrong saving your predictions. Try again.";
    statusEl.style.color = "#e2a04a";
    console.error(error);
    return;
  }

  statusEl.textContent = "Predictions saved. Good luck.";
  statusEl.style.color = "#5FA85C";
  loadLeaderboard();
});

// ---- 5. LEADERBOARD ----
function scorePrediction(pred, result) {
  if (pred.home_score === result.home && pred.away_score === result.away) return 3;
  const predWinner = pred.home_score > pred.away_score ? "home" : pred.home_score < pred.away_score ? "away" : "draw";
  const actualWinner = result.home > result.away ? "home" : result.home < result.away ? "away" : "draw";
  return predWinner === actualWinner ? 1 : 0;
}

async function loadLeaderboard() {
  const boardEl = document.getElementById("leaderboardBoard");
  boardEl.innerHTML = `<p class="empty-note">Loading the table...</p>`;

  const { data, error } = await supabase.from("predictions").select("*");

  if (error) {
    boardEl.innerHTML = `<p class="empty-note">The table couldn't load right now.</p>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    boardEl.innerHTML = `<p class="empty-note">No predictions yet. Be the first on the table.</p>`;
    return;
  }

  const totals = {};
  data.forEach((row) => {
    const match = matches.find((m) => m.id === row.match_id);
    if (!match || !match.result) return;
    const pts = scorePrediction(row, match.result);
    totals[row.player_name] = (totals[row.player_name] || 0) + pts;
  });

  const names = Object.keys(totals);
  if (names.length === 0) {
    boardEl.innerHTML = `<p class="empty-note">Predictions are in. Points appear once results are entered.</p>`;
    return;
  }

  const ranked = names
    .map((name) => ({ name, points: totals[name] }))
    .sort((a, b) => b.points - a.points);

  boardEl.innerHTML = "";
  ranked.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "score-row" + (i < 3 ? " top" : "");
    row.innerHTML = `
      <span class="score-rank">${i + 1}</span>
      <span class="score-name">${entry.name}</span>
      <span class="score-total">${entry.points} pts</span>
    `;
    boardEl.appendChild(row);
  });
}

loadLeaderboard();
