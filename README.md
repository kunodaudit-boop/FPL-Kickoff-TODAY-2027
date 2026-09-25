# FPL Kickoff Today 2027 — Website

Final redesign prepared through GW5.

## Website structure

- Home dashboard — bright Samut Prakan / stadium visual direction
- Competitions — six clearly separated competitions
  1. Full Season
  2. Gameweek
  3. First Chance
  4. Second Chance
  5. Lucky Game
  6. Mini Game
- Gallery — GW1 to GW5 season stories
- Official Rules Archive
- Finance — separate from competitions

The league is closed. No league code or Join League / Invite Friends CTA is displayed.

## Weekly score update

Edit only `app/league-data.js` when a new GW is finished.

Add a new block under `gameweeks`, for example GW6, with all 11 managers in official ranking order. The Home page, Full Season table, latest GW winner, and Gameweek tabs update automatically.

## Adding gallery images

1. Add the image to `public/gallery/gwX/`.
2. Add its filename and title to `gallery` in `app/content-data.js`.

## Deployment

Upload the project contents to the existing GitHub repository root and commit. Vercel will redeploy automatically.
