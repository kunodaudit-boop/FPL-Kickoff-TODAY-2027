# FPL Kickoff Today 2027 — V3

Master redesign based on the approved bright Samut Prakan mockup.

## V3 highlights
- Home UI follows the approved mockup more closely: bright sky / stadium / Samut Prakan visual, navy navigation, large dashboard cards, clean spacing.
- Six competitions remain clearly separated with different accent colours.
- First Chance and Second Chance now show their rules directly inside each section.
- Lucky Game winner artwork is restored in the Lucky Game section.
- League Statistics now has two modes:
  - Gameweek: select any GW and view ownership, captains, differential picks, bench, transfers and chips from FPL.
  - Season Overview: hybrid score statistics, form, wins, consistency, transfers and hits.
- GW1–GW5 scores are permanently taken from `app/league-data.js` and are never overwritten by FPL.
- GW6+ can be appended automatically from FPL League ID 606037 when all 11 managers are matched.
- Gallery, Rules, Mini Game, Lucky Game and Finance remain custom league content.

## FPL integration
Server route: `app/api/fpl/route.js`

Public FPL data is requested from Fantasy Premier League and cached on Vercel. If FPL is temporarily unavailable, the locked league data and custom content still render.

## Deploy
Upload the whole project to the existing GitHub repository. Vercel should redeploy automatically.
