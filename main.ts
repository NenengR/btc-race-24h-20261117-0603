import { runBars } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const LOOKBACK = 480;
const RET_BARS = 15;
const ENTRY_PCT_NUM = 101n;
const ENTRY_PCT_DEN = 100n;
const RET_MIN_NUM = 1n;
const RET_MIN_DEN = 1000n;
const NO_ENTRY_FROM_SEQ = 1320;
const TP_PCT_NUM = 1008n;
const TP_PCT_DEN = 1000n;
const SL_PCT_NUM = 992n;
const SL_PCT_DEN = 1000n;
const MAX_HOLD = 120;
const MAX_SLIPPAGE = 100;

interface OwnPosition {
  qty: bigint;
  cost: bigint;
  entrySeq: number;
}

let closes: bigint[] = [];
let own: OwnPosition | null = null;
let pendingEntrySeq: number | null = null;

function withinOnePctOfLo480(closeNow: bigint, lo480: bigint): boolean {
  return closeNow * ENTRY_PCT_DEN <= lo480 * ENTRY_PCT_NUM;
}

function ret15Gt001(closeNow: bigint, close15: bigint): boolean {
  return closeNow * RET_MIN_DEN > close15 * (RET_MIN_DEN + RET_MIN_NUM);
}

await runBars({
  onBatch(state, batch) {
    const seq: number = state.seq;
    const closeNow = state.close(SYMBOL);
    if (closeNow === null) return [];

    closes[seq] = closeNow;

    // Apply fills: cost and qty come from the fill; entrySeq from when the order was sent.
    for (const f of batch.fills) {
      if (f.symbol !== SYMBOL) continue;
      if (f.status === 'filled') {
        if (f.side === 'buy') {
          own = { qty: BigInt(f.qty), cost: BigInt(f.notional_quote_units), entrySeq: pendingEntrySeq ?? seq };
          pendingEntrySeq = null;
        } else {
          own = null;
        }
      }
    }

    const orders: any[] = [];

    if (own === null) {
      if (seq < NO_ENTRY_FROM_SEQ && closes.length >= LOOKBACK + 1) {
        let lo480 = closes[seq - 480];
        for (let i = seq - 479; i <= seq - 1; i++) {
          const c = closes[i];
          if (c < lo480) lo480 = c;
        }
        const close15 = closes[seq - RET_BARS];
        if (close15 !== undefined && close15 > 0n) {
          if (withinOnePctOfLo480(closeNow, lo480) && ret15Gt001(closeNow, close15)) {
            pendingEntrySeq = seq;
            orders.push({
              side: 'buy',
              symbol: SYMBOL,
              notional_quote_units: state.cash.toString(),
              max_slippage_bps: MAX_SLIPPAGE,
              client_id: `b${seq}`,
            });
          }
        }
      }
    } else {
      const value = state.value(SYMBOL, own.qty, closeNow);
      let doSell = false;
      if (value >= own.cost * TP_PCT_NUM / TP_PCT_DEN) doSell = true;
      else if (value <= own.cost * SL_PCT_NUM / SL_PCT_DEN) doSell = true;
      else if (seq - own.entrySeq >= MAX_HOLD) doSell = true;

      if (doSell) {
        orders.push({
          side: 'sell',
          symbol: SYMBOL,
          qty: own.qty.toString(),
          max_slippage_bps: MAX_SLIPPAGE,
          client_id: `s${seq}`,
        });
      }
    }

    return orders;
  },
});
