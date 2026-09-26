# Delivery Orders - Rationale

## Context
Delivery orders represent the outgoing flow of inventory. They must ensure that stock is properly tracked and that we never promise stock we don't have (avoiding negative inventory). The system needs a clear workflow from draft to completion.

## Options considered
1. **Immediate deduction on creation**: Decrease `stock_levels.on_hand` as soon as the delivery is created.
   - *Pros*: Simple to implement.
   - *Cons*: Highly inaccurate. Draft deliveries might be canceled, leading to phantom stock movements and a polluted ledger.

2. **Deduction only on completion (Chosen)**: Stock is only decreased when the physical goods leave the warehouse and the delivery is marked `done`. To prevent double-promising, a `ready` state reserves the stock.
   - *Pros*: Maintains strict integrity of `stock_levels` and `stock_ledger_entries`. Accurately reflects reality.
   - *Cons*: Requires a state machine and validation logic.

## Rationale
Option 2 aligns with the foundational architecture (see `0001-foundation-architecture`). The state machine (`draft` -> `waiting` -> `ready` -> `done`) is standard in warehouse management. `waiting` implies stock is insufficient, `ready` means picking can proceed, and `done` finalizes the ledger.
