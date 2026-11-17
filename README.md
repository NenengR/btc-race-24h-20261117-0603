[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/NenengR/btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/NenengR/btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603)

# BTC Race 3 bot (btc-race-24h-20261117-0603)

## Strategy: bounce-C

Long-only BTC (CBBTC) bot that buys the bounce off the 8-hour low and exits fast.

**Entry (only when flat):**
- `lo480` = lowest close of the previous 480 bars (excluding current bar).
- `ret15` = close / close 15 bars ago − 1.
- BUY full cash when `close <= lo480 * 1.01` (within 1.0% of the 8-hour low) AND `ret15 > 0.001` (a 15-min bounce has started).
- No new entries at seq >= 1320 (final 120 bars): a late entry can't reach take-profit before the forced flatten.

**Exit (only when holding):**
- Take-profit: position value >= cost * 1.008 → SELL full qty.
- Stop-loss: position value <= cost * 0.992 → SELL full qty.
- Max hold: seq − entry_seq >= 120 bars (2 hours) → SELL full qty.

`max_slippage_bps: 100`, client ids `b<seq>` (buy) / `s<seq>` (sell). Cost basis and qty are tracked from the fills received in each batch, not recomputed from the account. Deterministic: no `Date`, no `Math.random`, no network, no files; all decisions from bar closes only.

## Dev-window analysis (1,440 bars, 0 gaps)

BTC nearly flat: $64,433.84 open → $64,775.95 close (+0.53%). High $65,609.83, low $63,874.36, range 2.65%. 600 up / 669 down / 171 flat bars. Best 4-hour bounce +2.72%.

Kit baselines (simulator): buy-and-hold +$1.07 (1 trade), hold-cash +$0.00 (0 trades), momentum +$2.45 (1 trade), ema-cross −$106.21 (68 trades), rsi-bollinger −$24.25 (11 trades), adx-momentum −$32.66 (26 trades).

A bounce-family sweep (2,406 passing combos) found a top PnL of +$22.96 with only 2 round trips. This config is deliberately NOT the single-best PnL: it is the best config with 4 round trips (8 trades), chosen because trade frequency on dev is the best proxy for firing at least once in the unseen race window (race 1's bot entered once on dev and made 0 trades live, finishing unranked). The margin is selective, not a broad plateau — report this honestly. A 0-trade race window is the main risk.

## Verified dev-window result (local simulator, `sim.py bot --twice`)

- Net PnL: +$17.668748 USDC (final cash $1,017.67 on $1,000 start).
- Trades: 8 fills (4 round trips). Win rate 0.75 (3 wins, 1 stop-loss). Fees $3.240899. Max drawdown 0.95%.
- 2x-fee PnL approx +$14.430793.
- Byte-identical replies across two runs (deterministic). L1 regrade reproduced byte for byte.

## Files

- `main.ts` — the bot (authored fresh this session).
- `vendor/makefun-bars.ts` — SDK shim copied byte-for-byte from the kit (excluded from authorship).
- `LICENSE` — MIT, NenengR 2026.
- `.makefun/owner.json` — wallet `9h1CQmgZYqWR1e1j2kPWm5mJcxTtFcthwt1T25wSmDCi`.

<sub>Entered on [make.fun](https://make.fun/bounty/btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
