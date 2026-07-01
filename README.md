# Golden Guess — setup guide

This site is completely free to run: GitHub Pages hosts the files, Supabase's free tier stores predictions and powers the leaderboard.

## 1. Create a Supabase project (free)

1. Go to supabase.com and sign up.
2. Click "New project." Pick any name and password (you won't need the password for this).
3. Wait about a minute for it to finish setting up.

## 2. Create the predictions table

In your Supabase project, open the **SQL Editor** and run this:

```sql
create table predictions (
  id bigint generated always as identity primary key,
  player_name text not null,
  match_id text not null,
  home_score int not null,
  away_score int not null,
  created_at timestamp with time zone default now(),
  unique (player_name, match_id)
);

alter table predictions enable row level security;

create policy "Anyone can submit a prediction"
on predictions for insert
to anon
with check (true);

create policy "Anyone can update their own prediction"
on predictions for update
to anon
using (true);

create policy "Anyone can read the leaderboard"
on predictions for select
to anon
using (true);
```

This lets any visitor submit and read predictions (needed for a public leaderboard), but they can only ever write rows into the `predictions` table — nothing else on your project is exposed.

## 3. Connect the site to your project

In Supabase: **Project Settings → API**. Copy the **Project URL** and the **anon public** key.

Open `app.js` and paste them in at the top:

```js
const SUPABASE_URL = "https://your-project-ref.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

## 4. Put the site on GitHub

1. Create a new repository on GitHub (public).
2. Upload these files: `index.html`, `style.css`, `app.js`, `rules.html`.
3. Go to the repo's **Settings → Pages**.
4. Under "Branch," pick `main` and `/root`, then save.
5. GitHub gives you a live URL like `https://yourusername.github.io/repo-name` within a minute or two.

## 5. Add your real matches

Open `app.js` and edit the `matches` array — add every fixture you want people to predict, with a unique `id`, the two team names, and the kickoff date. Leave `result: null` until the match is played.

## 6. Enter results as matches finish

After a real match ends, find it in the `matches` array in `app.js` and fill in:

```js
result: { home: 2, away: 1 }
```

Commit and push the change (or edit the file directly on GitHub and commit). The leaderboard recalculates automatically the next time anyone loads the page.

## 7. Finish the rules page

Open `rules.html` and fill in the bracketed placeholders — eligibility, tiebreaker, prize, and your contact email. This page matters: most ad networks and basic contest law expect it.

## 8. Add ads once the site has content

Apply for Google AdSense once your matches, rules page, and a few real predictions are live — AdSense won't approve an empty site. Once approved, they'll give you a snippet to paste before `</head>` in `index.html` and `rules.html`.

## Costs

- GitHub Pages: free, no limit that matters here
- Supabase free tier: free, generous enough for a hobby-sized contest (500MB database, no monthly submission cap that you'd hit at this scale)
- Domain: optional — the `github.io` address works fine, or buy a custom domain later (~$10-15/year) once you want something more memorable

Total cost to launch: $0.
