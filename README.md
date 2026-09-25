# FPL Kickoff Today 2027 — League Dashboard

Next.js dashboard for the private FPL league **FPL Kickoff Today 2027**.

## Weekly update — easiest method

For a new Gameweek, edit only `app/league-data.js`.

1. Copy the previous Gameweek block inside `gameweeks`.
2. Change the key to the new GW number, e.g. `6:`.
3. Replace the 11 rows with the new official ranking order and points.
4. Commit the change to `main`.
5. Vercel redeploys automatically.

The website automatically updates:
- latest GW label
- GW tabs
- latest GW winner
- cumulative points
- season leader
- number of GW wins
- Gameweek Statement

If a Mini Game Save is used, add it to `miniGameSaves` in the same file.

## Finance

`Manager Financial` is intentionally separate from weekly score automation because it includes Lucky Pool, Mini Game and Lucky Game amounts that cannot be inferred safely from FPL points alone. Update `financialThroughGw` and the `financial` rows only when those figures have been reconciled.

Bank account numbers, bank names and payment-channel details are intentionally excluded from the public dashboard.
