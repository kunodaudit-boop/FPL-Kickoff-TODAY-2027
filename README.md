# FPL Kickoff Today 2027 — League Dashboard

Next.js dashboard for the private FPL league **FPL Kickoff Today 2027**.

## Included data
- Verified Gameweek points: GW1–GW5
- 11 managers and team names
- Cumulative points derived from GW1–GW5
- Reconciled Manager Financial table
- Reconciled Gameweek Statement
- Mini Game Save markers (GW1 Guide, GW2 Ohm, GW3 Pee, GW4 Deer)
- The Diff GW5: Jimmy / Iwobi 5 pts vs Guide / Mykolenko 5 pts (tie)
- Lucky Game GW4: Best won from Matty Cash -1
- Lucky Game status: prizes #3 and #5 claimed
- Gallery with current season posters

## Privacy
Bank account numbers, bank names and payment-channel details from the source spreadsheet are intentionally excluded from the public dashboard.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Create a GitHub repository.
2. Upload this project.
3. Sign in to Vercel with GitHub.
4. Add New → Project → import the repository.
5. Vercel detects Next.js automatically.
6. Click Deploy.

No environment variables are required for this version.
