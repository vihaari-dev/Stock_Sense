# Scope: STOCKSENSE

StockSense is an inventory management system for a company that needs one clear, auditable record of products, stock, warehouses, locations, operations, and movement history across incoming goods, outgoing deliveries, internal transfers, and stock adjustments. It serves inventory managers and warehouse staff who need dependable operational visibility and a reliable view of stock across the business.

**Build approach:** Tracer Bullet (build the working core end to end, one cohesive capability at a time, then expand). This product depends on stock correctness, role responsibilities, and traceable movements, so vertical slices are safer than broad parallel workstreams.
**Workflow:** Beta (after develop, run check verify then test). This is a real operating product with role awareness, inventory correctness, and ledger history, but it is not a highly regulated or payment heavy system.

## Executive product summary

StockSense replaces scattered manual inventory tracking with a centralized system that keeps product, stock, warehouse, location, operational documentation, and movement history in one place. The product must be auditable, location aware, and role aware without turning every concept into a technical design decision in this scope document.

The core value is not the screens alone, but the inventory truth: every stock changing event must be traceable, every movement logged, and the system must distinguish between product master data, physical stock availability, operational documents, and the stock ledger. The product is designed for two primary roles, not one generic user type.

## Target users

The product has exactly two primary roles.

### Inventory Manager

Responsible for managing incoming stock and outgoing stock. This is a production role focused on operational documents that increase and decrease inventory.

### Warehouse Staff

Responsible for transfers, picking, shelving, and counting. This role acts on the physical flow of goods between locations and on operational reconciliation.

## Role responsibility summary

| Role | Primary responsibilities | Source confidence | Authorization status |
|---|---|---|---|
| Inventory Manager | incoming stock, outgoing stock | explicit | needs authorization decision |
| Warehouse Staff | transfers, picking, shelving, counting | explicit | needs authorization decision |

## Authorization decisions that remain unresolved

The source defines responsibilities more clearly than it defines exact permissions. The product scope keeps these as decisions for later architecture and product design.

- Who can create, validate, print, cancel, or reopen receipts and deliveries.
- Who can create or validate internal transfers and adjustments.
- Who can manage product master data, warehouse master data, and location master data.
- Who can approve or reject a waiting delivery when stock becomes available.
- Who can reassign the responsible user on a document.
- Which role is allowed to view stock, change stock, and access sensitive operational reports.
- Whether contact records are simple document references or a managed business master data object.

## Complete feature inventory

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Foundation and project setup | Foundation | planned |
| 2 | Authentication and profile | Foundation | in-progress |
| 3 | Dashboard and operational overview | Foundation | planned |
| 4 | Product master data | Core capability | planned |
| 5 | Product categories | Core capability | planned |
| 6 | Warehouse management | Core capability | in-progress |
| 7 | Location management | Core capability | planned |
| 8 | Stock engine and stock ledger | Core capability | planned |
| 9 | Stock page and stock availability | Core capability | planned |
| 10 | Receipts | Operational workflow | planned |
| 11 | Delivery orders | Operational workflow | planned |
| 12 | Internal transfers | Operational workflow | planned |
| 13 | Inventory adjustments | Operational workflow | planned |
| 14 | Move history and audit trail | Operational workflow | planned |
| 15 | Alerts and low stock | Operational workflow | planned |
| 16 | Reports | Reporting | planned |
| 17 | Search and smart filters | Cross cutting | planned |
| 18 | List view and Kanban workflow | Cross cutting | planned |

## Foundations

### 1. Foundation and project setup · planned · needs a decision
Intent: establish the project baseline, shared working conventions, and product guardrails so the inventory workflows can be built in a stable, testable sequence.
**Done when:** the team has a clear product baseline, a recognized scope boundary, and a shared understanding of the foundation risks that need later design.
- [ ] Design it (spec): /architect foundation and project setup

### 2. Authentication and profile · in-progress · docs/specs/0001-foundation-architecture/0001-auth-design.md
Intent: provide secure access for the two user roles, protect inventory operations, and support the required sign up, login, logout, and password reset flows.
**Done when:** users can sign up, log in, reset a password with OTP, view profile, and be redirected to the dashboard after authentication, with invalid credentials and reset errors surfaced clearly.
- [x] Design it (spec): docs/specs/0001-foundation-architecture/0001-auth-design.md
- [x] Build it (code): server/src/routes/auth.ts
- [ ] Verify it
- [ ] Test it

### 3. Dashboard and operational overview · planned · needs a decision
Intent: give each role a clear operational summary of inventory state and pending work, using a single dashboard that surfaces key inventory and operational metrics.
**Done when:** the dashboard shows the required inventory KPIs, document counts, and filters that operate across document type, status, warehouse, location, and product category.
- [ ] Design it (spec): /architect dashboard and operational overview

## Core capability slices

### 4. Product master data · planned · needs a decision
Intent: manage the product catalog and product master data needed for inventory operations, including SKU, category, UOM, reorder rules, and stock visibility by location.
**Done when:** a product can be created, updated, searched by SKU or code, and tracked with the required product attributes, while leaving deeper product data decisions for architecture.
- [ ] Design it (spec): /architect product master data

### 5. Product categories · planned · needs a decision
Intent: organize products into categories so inventory can be grouped, filtered, and reported consistently.
**Done when:** products can be assigned to categories, categories support filtering, and category based inventory filters work across the product and dashboard flows.
- [ ] Design it (spec): /architect product categories

### 6. Warehouse management · in-progress · docs/specs/0004-warehouse-management.md
Intent: support a multi warehouse model that treats each warehouse as a first class inventory concept and allows stock to be tracked across locations in the business.
**Done when:** a warehouse can be created with name, short code, and address, and the system can distinguish stock and movement history across multiple warehouses.
- [x] Design it (spec): docs/specs/0004-warehouse-management.md
- [ ] Build it (code):
  - Backend models and routes
  - Frontend API and context
  - Frontend UI components
  - Routing integration
- [ ] Verify it
- [ ] Test it

### 7. Location management · planned · needs a decision
Intent: place inventory within the correct warehouse physical structure so stock is location aware and material movement can be tracked accurately.
**Done when:** locations belong to warehouses, can be named and coded, and support questions about what product is in stock, how much, and where it physically sits.
- [ ] Design it (spec): /architect location management

### 8. Stock engine and stock ledger · in-progress · docs/specs/0008-stock-engine-and-ledger/index.md
Intent: preserve the central stock behavior that drives inventory correctness, including receipts, deliveries, transfers, and adjustments, with every movement recorded in an auditable ledger.
**Done when:** the system defines the inventory rules for stock increases, decreases, location changes, and adjustments, and preserves the requirement that all stock changing events are logged and traceable.
- [x] Design it (spec): docs/specs/0008-stock-engine-and-ledger/index.md
- [ ] Build it (code)
- [ ] Verify it
- [ ] Test it

### 9. Stock page and stock availability · planned · needs a decision
Intent: provide a single stock view that shows product level availability, per unit cost, on hand quantity, free to use quantity, and the ability to update stock through a traceable flow.
**Done when:** the stock view shows product, warehouse, and location awareness, distinguishes on hand from free to use, and keeps any stock update tied to an auditable movement rather than a silent mutation.
- [ ] Design it (spec): /architect stock page and stock availability

## Operational workflow slices

### 10. Receipts · planned · needs a decision
Intent: support the incoming goods workflow from document creation through validation and completion, with automatic stock impact only after the receipt is completed and a traceable ledger movement is recorded.
**Done when:** an inventory manager can create a receipt, add supplier or contact details, add products, enter quantities, validate the document, and complete it so stock increases appropriately while the operation remains traceable.
- [ ] Design it (spec): /architect receipts

### 11. Delivery orders · planned · needs a decision
Intent: support the outgoing goods workflow from document creation through picking, packing, validation, and completion, with stock decreasing only at completion and never in draft or waiting states.
**Done when:** a delivery can be created, searched by reference or contact, grouped by status in a Kanban view, validated, and completed without causing invalid negative inventory while waiting deliveries remain clearly visible.
- [ ] Design it (spec): /architect delivery orders

### 12. Internal transfers · planned · needs a decision
Intent: support stock movements between source and destination within the business so location transfers change where inventory sits without changing total stock quantity.
**Done when:** a transfer moves stock from one location or warehouse to another, source and destination quantities are updated correctly, total quantity remains unchanged, and the movement is logged.
- [ ] Design it (spec): /architect internal transfers

### 13. Inventory adjustments · planned · needs a decision
Intent: reconcile recorded stock with physical count and make the adjustment explicit, auditable, and aligned with the warehouse staff counting responsibility.
**Done when:** a user can select a product and location, enter a counted quantity, compare it to recorded stock, calculate the difference, validate the adjustment, and update inventory with a movement record.
- [ ] Design it (spec): /architect inventory adjustments

### 14. Move history and audit trail · planned · needs a decision
Intent: show a searchable, filterable history of inventory movements so business users can inspect what moved, when, where, and by which operation.
**Done when:** the system exposes movement history with product, quantity, reference, direction, status, date, source, and destination, while keeping individual product movements visible when a document contains multiple products.
- [ ] Design it (spec): /architect move history and audit trail

### 15. Alerts and low stock · planned · needs a decision
Intent: highlight when inventory is approaching or reaching a critical state and when operational documents are blocked because stock is unavailable.
**Done when:** low stock and out of stock conditions are visible in the relevant product and operation flows, and waiting deliveries are clearly identified when stock is unavailable.
- [ ] Design it (spec): /architect alerts and low stock

### 16. Reports · planned · needs a decision
Intent: give users the minimum operational reporting needed for stock status, low stock visibility, and movement history.
**Done when:** users can view low stock, stock status, and movement history reports that align with the product's operational and inventory needs without inventing advanced analytics.
- [ ] Design it (spec): /architect reports

### 17. Search and smart filters · planned · needs a decision
Intent: make it easy to locate products and operational records with text search and combined filter logic across the main inventory views.
**Done when:** users can search product by SKU or code and filter operational documents by document type, status, warehouse, location, and product category, with search and filter working together.
- [ ] Design it (spec): /architect search and smart filters

### 18. List view and Kanban workflow · planned · needs a decision
Intent: support the operational views needed by the inventory team, especially list and Kanban layouts for receipts and deliveries.
**Done when:** receipts and deliveries can be displayed in both list and Kanban views, grouped by status, and easily searched and filtered within their operational contexts.
- [ ] Design it (spec): /architect list view and Kanban workflow

## Deferred and future scope

The following items were noted in the source but are not part of the core inventory MVP and need explicit product decisions if they become priority work later.

- Manufacturing and work orders: unconfirmed and future, not part of the core inventory product.
- Advanced procurement and automatic purchasing: not required for the base inventory product.
- Customer or supplier master data beyond simple contact references: not yet established as a separate feature.
- Accounting integrations: beyond the scope of the immediate inventory system.
- Advanced forecasting and replenishment optimization: a later product capability, not core MVP.
- External notification infrastructure: channel and delivery mechanism remain open.
- Complex approval workflows: not defined by the source and not required for MVP.

## Product requirements

### Dashboard requirements

The dashboard must serve as the operational landing page after authentication and provide a snapshot of inventory activity.

Required KPI set:
- Total Products in Stock
- Low Stock and Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

Additional operational statistics mentioned in the board include:
- receipts to receive
- deliveries to deliver
- late operations
- waiting operations
- number of operations
- current inventory statistics

The scope keeps a distinction between inventory KPIs and operational document statistics. The source suggests that late is derived from schedule date and waiting is a condition of stock readiness, not necessarily a static lifecycle status. These distinctions remain open questions until product design confirms them.

### Product requirements

Products must support:
- create product
- update product
- name
- SKU or code
- category
- unit of measure
- optional initial stock
- product categories
- stock availability by location
- reordering rules
- SKU search
- smart filters

Source notes include product and stock concepts such as product, SKU, UOM, reorder, per unit cost, on hand, and free to use. Those should remain distinct in the product language unless a later architecture decision proves they can be merged.

### Warehouse requirements

Warehouse is a first class inventory concept. Required fields include:
- name
- short code
- address

The system must support multi warehouse operation and allow inventory to be distributed across multiple warehouses.

### Location requirements

Locations belong to warehouses and represent physical storage areas, rooms, racks, production areas, or similar spaces. Required fields include:
- name
- short code
- warehouse

The product must be able to answer where inventory physically exists.

### Stock requirements

The handwritten whiteboard defines the central stock behavior:
- Receipt increases stock
- Transfer changes location
- Delivery decreases stock
- Adjustment changes stock

The stock engine must preserve location awareness and the ledger record of every stock changing movement. The product must answer what product is in stock, how much, in which warehouse, and in which location.

The stock page must show:
- product
- per unit cost
- on hand
- free to use

The source says users can update stock from this area, but the exact behavior is not fully defined. The product scope preserves the rule that stock updates must remain auditable and traceable.

### Receipt requirements

Receipts represent incoming goods. Required flow:
1. Create a receipt.
2. Add supplier or contact.
3. Add products.
4. Enter quantities received.
5. Validate.
6. Stock increases automatically.

Required fields and behaviors include:
- receipt reference
- contact
- schedule date
- status
- responsible user
- product list
- quantity
- new product
- list view
- Kanban view
- validate
- print after done
- cancel
- search by reference and contact

The source explicitly states that responsible is automatically filled from the current logged in user.

### Delivery requirements

Delivery orders represent outgoing stock. Required flow:
1. Pick items.
2. Pack items.
3. Validate.
4. Stock decreases automatically.

Required fields and behaviors include:
- delivery reference
- delivery address
- contact
- schedule date
- operation type
- status
- responsible user
- product list
- quantity
- new product
- list view
- Kanban view
- validate
- print
- cancel
- search by reference and contact
- waiting for stock behavior
- unavailable product line indication

The source says unavailable products should be visually marked in red and notifications should occur when product is not in stock.

### Internal transfer requirements

Internal transfers are required and represent movement inside the company. Required behaviors include:
- move stock from source to destination
- source location decreases
- destination location increases
- total quantity remains unchanged
- movement is recorded

The conceptual business behavior is required even though a detailed transfer screen is not fully designed in the source material.

### Adjustment requirements

Adjustments reconcile recorded stock with physical count. The process includes:
1. select product
2. select location
3. enter counted quantity
4. compare with recorded quantity
5. calculate difference
6. validate
7. update stock
8. record movement

Examples:
- recorded 100, physical 97, adjustment minus 3, new stock 97
- recorded 100, physical 105, adjustment plus 5, new stock 105

Counting is a warehouse staff responsibility and must appear in the adjustment workflow.

### Stock ledger requirements

The stock ledger is the historical record of inventory movements. Every movement must be recorded.

The explicit stock changing operations are:
- receipt
- delivery
- internal transfer
- adjustment
- initial or open stock where applicable

The ledger must support the ability to determine what changed, which product changed, where it changed, how much changed, which operation caused it, who performed it, and when it happened.

### Move history requirements

Move history is required and shows inventory movements over time. The visual model includes:
- reference
- contact
- status
- date
- from
- to
- quantity
- product movement

Requirements include:
- search
- filtering
- chronological inspection
- incoming and outgoing distinction
- individual product movement visibility when a document contains multiple products

The whiteboard uses green for in and red for out, and this should remain a product concept rather than a UI implementation decision in scope.

### Alerts requirements

Low stock alerts are required. Alerts must cover at least:
- low stock
- out of stock
- delivery blocked or waiting because stock is unavailable

The source specifically mentions Alerts and Reports with low stock, stock status, and movement history.

### Reports requirements

Reporting is part of the product. At minimum the system must support:
- low stock report
- stock status report
- movement history

The scope leaves advanced analytics, forecasting, and rich business reporting as future capability work.

### Search requirements

Search is required in relevant operational screens. Explicit examples include:
- receipts by reference and contact
- deliveries by reference and contact
- products by SKU or code
- move history search

Search and filtering should work together where appropriate.

### Smart filter requirements

Smart filters are required and must support relevant dimensions such as:
- document type
- status
- warehouse
- location
- product category

The filters should work together across relevant screens, not as isolated incompatible search concepts.

### List view requirements

List view is required for operational records, especially receipts, deliveries, and move history.

### Kanban requirements

Kanban view is required for operational status tracking. At minimum:
- receipts
- deliveries

Kanban should be organized around operational status. The exact UI implementation is not part of scope.

### Authentication requirements

Required flows:
- sign up
- login
- forgot password
- OTP based password reset
- logout
- my profile
- redirect authenticated users to the inventory dashboard

Whiteboard requirements include:
- unique login ID
- login ID length between 6 and 12 characters
- unique email
- password complexity
- password length greater than 8 characters
- invalid credentials produce an error

The password uniqueness note should be treated as a product question, not silently converted into a global password uniqueness rule.

### Profile requirements

Profile menu includes:
- My Profile
- Logout

## Business rules

- Receipt increases stock after completion and records movement.
- Delivery decreases stock after completion and records movement.
- Internal transfer decreases the source location and increases the destination location while keeping total quantity unchanged and recording movement.
- Adjustment changes stock according to the difference between recorded stock and physical count and records movement.
- Draft operations do not affect final inventory.
- Waiting operations do not deduct outgoing stock.
- Completed operations must not silently execute twice.
- Historical movements remain traceable.
- Every stock changing event is recorded.
- Waiting deliveries are operationally blocked until stock is available.
- Product and stock must remain distinct concepts, even though they are related.
- The system must support multi warehouse inventory across locations.
- Responsible user on operational documents is set from the current logged in user by default.
- References should be human readable and consistent, following the warehouse, operation, and ID pattern.

## Inventory invariants

- Inventory is never treated as one global quantity only.
- Inventory must be location aware.
- A warehouse can hold stock in multiple locations.
- Stock change actions must be auditable.
- Source and destination changes in a transfer leave total stock unchanged.
- Draft and waiting operations do not finalize stock change.
- Completed transactions create a ledger record and do not silently duplicate.
- Out of stock and low stock are distinct conditions.
- Completed receipt and delivery documents remain visible in history even if later canceled or affected by a follow up adjustment.

## Status and lifecycle concepts

Known statuses:
- Draft
- Waiting
- Ready
- Done
- Canceled

The source uses explicit flows:
- Receipt: Draft → Ready → Done
- Delivery: Draft → Waiting → Ready → Done

The system also contains derived operational concepts:
- Late: schedule date earlier than today
- Operations: schedule date later than today
- Waiting: waiting for stock

### Status matrix

| Document | Status | Explicit transition | Unknown transition | Derived condition |
|---|---|---|---|---|
| Receipt | Draft | Draft → Ready | Ready → Canceled, Draft → Canceled | none |
| Receipt | Ready | Ready → Done | Ready → Canceled | none |
| Receipt | Done | none | none | print available after done |
| Delivery | Draft | Draft → Waiting, Draft → Ready | Draft → Canceled | none |
| Delivery | Waiting | Waiting → Ready | Waiting → Canceled | waiting for stock |
| Delivery | Ready | Ready → Done | Ready → Canceled | none |
| Delivery | Done | none | none | print available |
| Transfer | not fully specified | not specified | not specified | source and destination change |
| Adjustment | not fully specified | not specified | not specified | physical count difference |
| All documents | Late | none | none | schedule date earlier than today |
| All documents | Waiting | none | none | waiting for stock |

## Source vs recommendation versus open question

### Source requirement

These items are directly stated by the written product brief or the whiteboard content and should remain as scope requirements.

- Two user roles with distinct responsibilities.
- Multi warehouse inventory.
- Location aware stock.
- Stock ledger and audit trail.
- Receipts, deliveries, transfers, and adjustments.
- Waiting, ready, draft, done, and canceled states.
- Low stock and out of stock behavior.
- SKU search, smart filters, list view, and Kanban.
- Human readable references based on warehouse, operation, and ID.
- Print and responsible user handling.

### Recommended product decision

These are not fully specified in the source and need a product decision before implementation, but the scope recommends a likely direction.

- Waiting should be treated as a process condition rather than as a permanent lifecycle state unless product owners choose otherwise.
- Stock updates should pass through the adjustment workflow rather than a silent direct mutation, because the product requires auditability.
- The stock page should show on hand and free to use as distinct quantities, with the reservation model defined later.
- Contact should initially be treated as a document attribute until the business decides whether it needs a larger master data feature.
- Notification channel for alerts and blocked deliveries should be a product decision, not an implementation choice.

### Open question

These decisions are explicitly unresolved and belong to later architecture or product review.

- Does shelving happen before or after receipt validation?
- Are pick and pack encoded as operational steps or separate lifecycle states?
- What exactly is the waiting to ready transition rule?
- Which document states are allowed to cancel and under what circumstances?
- What is the exact reference sequence and uniqueness scope?
- What is the precise threshold model for low stock and reorder detection?
- Is the password uniqueness note a real business rule or a board note to revisit?
- What is the exact difference between on hand and free to use in operational terms?
- Is the production work order note an actual future feature or an unrelated discussion?

## Gap analysis between sources

| Requirement area | Classification | Notes |
|---|---|---|
| Low stock alerts | A | Present in written requirements and whiteboard |
| Multi warehouse | A | Explicit in written and board content |
| SKU search | A | Explicit requirement in product and search notes |
| Smart filters | A | Required in product description and board behavior |
| Two roles | A | Explicit in the written source |
| Warehouse staff responsibilities | A | Explicit in written requirements |
| Shelving | D | Required but workflow timing is unresolved |
| Picking | A | Required, but state representation is ambiguous |
| Counting | A | Required, explicit warehouse staff responsibility |
| Internal transfer workflow | D | Required but not fully designed as a screen or lifecycle |
| Adjustment workflow | A | Explicit business process exists |
| Dashboard KPI definitions | D | Board mentions metrics, but exact business meaning needs confirmation |
| Cancellation transitions | D | Cancel exists but the allowed transitions are not fully defined |
| Waiting to ready behavior | D | Source describes waiting and ready but not the exact transition trigger |
| Pick and pack representation | D | Operational steps are clear but lifecycle representation is not |
| Password uniqueness note | D | Not clearly a real business rule |
| Contact management | E | Contact is required but the master data decision is open |
| Reference sequence behavior | E | Sequence generation and uniqueness scope are not specified |
| Stock update behavior | D | Update is allowed but not fully defined as an adjustment flow |
| On hand versus free to use | D | Required distinction exists but exact semantics are open |
| Kanban requirements | A | Board and flow requirements are explicit |
| List view requirements | A | Explicitly described |
| Move history search | D | Required but some annotations appear to specific to delivery |
| Manufacturing work order annotation | C | Present only as a whiteboard note, not in written product statement |
| Notification behavior | E | Required but notification channel and mechanism are not specified |
| Reorder rule behavior | E | Reordering is required but exact threshold and rule logic are unresolved |

Classification guide:
- A: Present in written requirements and whiteboard
- B: Present only in written requirements
- C: Present only in whiteboard
- D: Ambiguous or contradictory
- E: Necessary production decision not specified by either source

## Role and authorization gap analysis

| Area | Inventory Manager | Warehouse Staff | Status |
|---|---|---|---|
| Authentication | Explicitly required | Explicitly required | Explicitly required |
| Dashboard | Explicitly required | Explicitly required | Explicitly required |
| Product management | Needs authorization decision | Not specified | Needs authorization decision |
| Product categories | Needs authorization decision | Not specified | Needs authorization decision |
| Stock viewing | Explicitly required | Explicitly required | Explicitly required |
| Stock updating | Needs authorization decision | Needs authorization decision | Needs authorization decision |
| Receipts | Explicitly required | Not specified | Needs authorization decision |
| Delivery | Explicitly required | Explicitly required | Needs authorization decision |
| Picking | Not specified | Explicitly required | Explicitly required |
| Packing | Not specified | Explicitly required | Explicitly required |
| Shelving | Not specified | Explicitly required | Explicitly required |
| Internal transfer | Not specified | Explicitly required | Needs authorization decision |
| Counting | Not specified | Explicitly required | Explicitly required |
| Adjustment | Needs authorization decision | Explicitly required | Needs authorization decision |
| Move History | Explicitly required | Explicitly required | Needs authorization decision |
| Reports | Needs authorization decision | Needs authorization decision | Needs authorization decision |
| Warehouse | Needs authorization decision | Needs authorization decision | Needs authorization decision |
| Location | Needs authorization decision | Needs authorization decision | Needs authorization decision |
| Profile | Explicitly required | Explicitly required | Explicitly required |

## End to end user scenarios

1. User signs up.
2. User logs in.
3. User resets password through OTP.
4. User reaches the dashboard.
5. Inventory Manager creates an incoming stock operation.
6. Incoming goods are received.
7. Goods are shelved into a warehouse location.
8. Receipt is completed.
9. Stock increases.
10. Warehouse Staff performs an internal transfer.
11. Source location decreases.
12. Destination location increases.
13. Total inventory remains unchanged.
14. Delivery is created when stock is available.
15. Warehouse Staff picks and packs the delivery.
16. Delivery is completed.
17. Stock decreases.
18. Delivery is created when stock is unavailable.
19. Delivery waits for stock.
20. Unavailable product line is visually identified.
21. Stock becomes available.
22. Waiting delivery becomes eligible for continuation.
23. Warehouse Staff counts physical inventory.
24. Physical count differs from recorded stock.
25. Adjustment is created.
26. Adjustment changes stock.
27. Movement is recorded.
28. Product reaches low stock threshold.
29. Low stock alert appears.
30. Product becomes unavailable.
31. Out of stock is shown.
32. User searches product by SKU.
33. User searches receipts or deliveries by reference or contact.
34. User filters operations.
35. User switches receipt or delivery from list to Kanban.
36. User views move history.
37. User views stock status.
38. User views low stock report.
39. User prints a completed operation.
40. User views My Profile.
41. User logs out.

## Feature acceptance criteria seeds

Each feature section above includes an observable Done when line. Those lines are acceptance criteria seeds, not implementation tasks. They define the product outcomes the later architecture work must satisfy.

## Dependencies between features

- Authentication and profile must exist before the dashboard can be personalized and protected.
- Warehouse and location management must exist before product stock and movement history can be placed correctly.
- Product master data must exist before receipts, delivery, transfers, and adjustments can operate reliably.
- Stock engine and stock ledger must exist before stock updates, movement history, and reporting can be trusted.
- Receipts and deliveries depend on product, warehouse, location, and stock availability rules.
- Internal transfers depend on warehouse and location management plus stock engine logic.
- Adjustments depend on counting workflow and stock engine rules.
- Alerts and reports depend on product thresholds, stock status, and movement history.
- Search and smart filters depend on product, warehouse, and document data structures.
- List and Kanban views depend on the operational documents and their statuses.

## Decisions that must go to architect

The following areas require architectural or product design decisions and should be captured in dedicated specs before implementation.

- Foundation and project setup
- Authentication and profile
- Dashboard KPI definitions and operational statistics logic
- Product master data and UOM semantics
- Inventory stock engine and ledger invariants
- On hand versus free to use semantics
- Receipt, delivery, transfer, and adjustment lifecycle behavior
- Shelving timing and workflow
- Waiting and ready transitions
- Pick and pack representation and lifecycle interaction
- Cancellation model and historical retention
- Reference numbering and sequence generation
- Product and warehouse authorization model
- Search and filtering strategy
- Alert notification behavior
- Contact management model
- Reorder threshold model
- Security, role awareness, and safe password handling

## Features that need specs

- Foundation and project setup
- Authentication and profile
- Dashboard and operational overview
- Product master data
- Product categories
- Warehouse management
- Location management
- Stock engine and stock ledger
- Stock page and stock availability
- Receipts
- Delivery orders
- Internal transfers
- Inventory adjustments
- Move history and audit trail
- Alerts and low stock
- Reports
- Search and smart filters
- List view and Kanban workflow

## Recommended JSM build approach

### Tracer Bullet

This product should use Tracer Bullet as the default build approach.

Reasoning:
- The central value is a working inventory truth, not a polished screen shell.
- Stock correctness, role separation, and ledger traceability are core product requirements.
- The system includes several dependent operational workflows that should be validated in end to end slices.
- The team is expected to work in parallel, so vertical slices reduce cross team confusion compared with broad frontend or backend streams.

### Evaluation of alternatives

- Skateboard: useful if the team wanted a narrow MVP first, but the source requires multiple operational flows and a shared stock engine from the beginning.
- Facade: too weak for a production inventory product where correctness matters more than a clickable prototype.
- Journey: useful for a single flow, but not ideal as the default because the product has several interlocking workflows and shared inventory rules.

## Recommended JSM workflow depth

### Beta

This is the recommended project default.

Reasoning:
- The product is intended for production use and includes real inventory operations.
- The product has two user roles and security concerns around stock changing actions.
- The inventory logic is central and risky if designed incorrectly.
- The team is working concurrently and the product is operationally significant.

Why not GA:
- The source does not establish a formal regulated compliance regime or payment system.
- The product does not yet show a need for the full review and documentation chain of GA.

Why not Alpha:
- The inventory correctness requirements and auditability needs are too important to rely only on a lighter process.

## Recommended vertical slicing and build order

The final build order should follow the sections above, with foundations first and then operational features in a vertical sequence.

1. Foundation and project setup
2. Authentication and profile
3. Dashboard and operational overview
4. Product master data
5. Product categories
6. Warehouse management
7. Location management
8. Stock engine and stock ledger
9. Stock page and stock availability
10. Receipts
11. Delivery orders
12. Internal transfers
13. Inventory adjustments
14. Move history and audit trail
15. Alerts and low stock
16. Reports
17. Search and smart filters
18. List view and Kanban workflow

This order minimizes dependency problems because the product's shared data model and inventory rules must be stable before specific operational flows become the main focus. The team can work in parallel on adjacent features once the shared backbone exists, but the sequence keeps the risk and dependency chain manageable.

## MVP boundary

The MVP must include the following core capabilities:
- two user roles with explicit responsibilities
- authentication with sign up, login, OTP reset, logout, and profile
- dashboard with inventory and operational snapshots
- products with category and SKU behavior
- warehouse and location support
- stock engine and stock ledger
- receipts
- deliveries
- internal transfers
- adjustments
- move history
- alerts for low stock and out of stock
- search and smart filters
- list and Kanban views for operational records
- reference numbers and responsible user behavior
- reports for low stock, stock status, and movement history

The MVP does not include manufacturing work orders or advanced procurement and forecasting.

## Future and deferred scope

The following items are noted by source but not required for the core inventory MVP and should remain future or unresolved until product owners confirm priority.

- manufacturing and work orders
- advanced procurement
- automatic purchasing
- CRM style contact management beyond simple document references
- accounting integrations
- complex approval workflows
- advanced forecasting
- external notification infrastructure
- large scale analytics and dashboard expansion

## Requirements completeness check

This scope intentionally treats the requirements as follows:

- became a scope requirement: user roles, warehouse and location, stock, operations, ledger, alerts, reports, search, filters, print, profile, and movement history
- became an open question: shelving timing, pick and pack representation, waiting to ready behavior, cancellation transitions, contact model, stock update behavior, on hand versus free to use, and notification channel
- became a recommended product decision: stock updates route through adjustment, waiting as operational condition, contact as document attribute initially, and alert channels as later design decisions
- became explicitly deferred future scope: manufacturing and work orders, procurement, accounting, advanced forecasting, external notification infrastructure, and complex approval flows

No source requirement was silently dropped.

## Completion report

## /scope plan · STOCKSENSE

**18 features planned, build approach Tracer Bullet, workflow Beta.**
Next: /clear, then /architect foundation and project setup
Heads up: the largest decisions still open are inventory authorization, stock engine semantics, and the exact handling of waiting, shelving, and pick or pack states, all of which must be resolved before implementation. 
Scope written to docs/scope/scope.md.
