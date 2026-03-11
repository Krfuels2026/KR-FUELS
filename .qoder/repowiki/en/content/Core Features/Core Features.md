# Core Features

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [schema.ts](file://convex/schema.ts)
- [accounts.ts](file://convex/mutations/accounts.ts)
- [vouchers.ts](file://convex/mutations/vouchers.ts)
- [reminders.ts](file://convex/mutations/reminders.ts)
- [accounts.ts](file://convex/queries/accounts.ts)
- [vouchers.ts](file://convex/queries/vouchers.ts)
- [reminders.ts](file://convex/queries/reminders.ts)
- [types.ts](file://apps/types.ts)
- [utils.ts](file://apps/utils.ts)
- [convex-api.ts](file://apps/convex-api.ts)
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx)
- [AccountMaster.tsx](file://apps/pages/AccountMaster.tsx)
- [LedgerReport.tsx](file://apps/pages/LedgerReport.tsx)
- [CashReport.tsx](file://apps/pages/CashReport.tsx)
- [Reminders.tsx](file://apps/pages/Reminders.tsx)
- [Dashboard.tsx](file://apps/pages/Dashboard.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
KR-FUELS is a modern fuel station accounting and operations platform built with a React frontend and a Convex backend. It focuses on:
- Daily voucher processing with batch entry and real-time validation
- Hierarchical chart of accounts with parent-child relationships and opening balances
- Financial reporting (ledger and cash statements) with export capabilities
- Operational reminders and task management
- Dashboard analytics for quick visibility

The system migrates from PostgreSQL to Convex, leveraging typed queries and mutations for robust data operations.

**Section sources**
- [README.md](file://README.md#L1-L13)

## Project Structure
The project is organized into:
- Frontend (React + TypeScript): Pages, components, hooks, utilities, and Convex API bindings
- Backend (Convex): Schema, queries, and mutations for data access and persistence

```mermaid
graph TB
subgraph "Frontend"
P1["apps/pages/DailyVoucher.tsx"]
P2["apps/pages/AccountMaster.tsx"]
P3["apps/pages/LedgerReport.tsx"]
P4["apps/pages/CashReport.tsx"]
P5["apps/pages/Reminders.tsx"]
P6["apps/pages/Dashboard.tsx"]
U["apps/utils.ts"]
T["apps/types.ts"]
C["apps/convex-api.ts"]
end
subgraph "Backend (Convex)"
S["convex/schema.ts"]
Q1["convex/queries/accounts.ts"]
Q2["convex/queries/vouchers.ts"]
Q3["convex/queries/reminders.ts"]
M1["convex/mutations/accounts.ts"]
M2["convex/mutations/vouchers.ts"]
M3["convex/mutations/reminders.ts"]
end
P1 --> C
P2 --> C
P3 --> C
P4 --> C
P5 --> C
P6 --> C
C --> Q1
C --> Q2
C --> Q3
C --> M1
C --> M2
C --> M3
Q1 --> S
Q2 --> S
Q3 --> S
M1 --> S
M2 --> S
M3 --> S
P1 --> U
P2 --> U
P3 --> U
P4 --> U
P5 --> U
P6 --> U
P1 --> T
P2 --> T
P3 --> T
P4 --> T
P5 --> T
P6 --> T
```

**Diagram sources**
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx#L1-L336)
- [AccountMaster.tsx](file://apps/pages/AccountMaster.tsx#L1-L228)
- [LedgerReport.tsx](file://apps/pages/LedgerReport.tsx#L1-L257)
- [CashReport.tsx](file://apps/pages/CashReport.tsx#L1-L604)
- [Reminders.tsx](file://apps/pages/Reminders.tsx#L1-L388)
- [Dashboard.tsx](file://apps/pages/Dashboard.tsx#L1-L219)
- [utils.ts](file://apps/utils.ts#L1-L69)
- [types.ts](file://apps/types.ts#L1-L56)
- [convex-api.ts](file://apps/convex-api.ts#L1-L33)
- [schema.ts](file://convex/schema.ts#L1-L85)
- [accounts.ts](file://convex/queries/accounts.ts#L1-L19)
- [vouchers.ts](file://convex/queries/vouchers.ts#L1-L19)
- [reminders.ts](file://convex/queries/reminders.ts#L1-L71)
- [accounts.ts](file://convex/mutations/accounts.ts#L1-L63)
- [vouchers.ts](file://convex/mutations/vouchers.ts#L1-L59)
- [reminders.ts](file://convex/mutations/reminders.ts#L1-L116)

**Section sources**
- [schema.ts](file://convex/schema.ts#L1-L85)
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx#L1-L336)
- [AccountMaster.tsx](file://apps/pages/AccountMaster.tsx#L1-L228)
- [LedgerReport.tsx](file://apps/pages/LedgerReport.tsx#L1-L257)
- [CashReport.tsx](file://apps/pages/CashReport.tsx#L1-L604)
- [Reminders.tsx](file://apps/pages/Reminders.tsx#L1-L388)
- [Dashboard.tsx](file://apps/pages/Dashboard.tsx#L1-L219)
- [utils.ts](file://apps/utils.ts#L1-L69)
- [types.ts](file://apps/types.ts#L1-L56)
- [convex-api.ts](file://apps/convex-api.ts#L1-L33)

## Core Components
- Daily Voucher: Batch transaction entry with real-time totals and cash tally logic
- Chart of Accounts: Hierarchical master with parent-child groups and opening balances
- Ledger Report: Consolidated ledger per account or group with export
- Cash Report: Periodic cash statement with multiple filter modes and export
- Reminders: Task and reminder management with CRUD operations
- Dashboard: Real-time cash KPIs, recent activity, and reminders

**Section sources**
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx#L1-L336)
- [AccountMaster.tsx](file://apps/pages/AccountMaster.tsx#L1-L228)
- [LedgerReport.tsx](file://apps/pages/LedgerReport.tsx#L1-L257)
- [CashReport.tsx](file://apps/pages/CashReport.tsx#L1-L604)
- [Reminders.tsx](file://apps/pages/Reminders.tsx#L1-L388)
- [Dashboard.tsx](file://apps/pages/Dashboard.tsx#L1-L219)

## Architecture Overview
The system follows a client-driven architecture with Convex as the backend-as-a-service:
- Frontend pages call Convex queries and mutations via typed hooks
- Queries fetch collections and apply indexes for efficient reads
- Mutations enforce validation and write operations
- Utilities encapsulate formatting and ledger calculations
- Types define the shared data contracts

```mermaid
sequenceDiagram
participant UI as "Page Component"
participant API as "convex-api.ts"
participant Query as "Convex Query"
participant Mut as "Convex Mutation"
participant DB as "Convex Storage"
UI->>API : useQuery/useMutation/useAction
API->>Query : invoke typed query
Query->>DB : read with indexes
DB-->>Query : collection/array
Query-->>API : result
API-->>UI : data/state
UI->>API : useMutation
API->>Mut : invoke typed mutation
Mut->>DB : insert/update/delete
DB-->>Mut : ack
Mut-->>API : result
API-->>UI : commit and refresh
```

**Diagram sources**
- [convex-api.ts](file://apps/convex-api.ts#L1-L33)
- [accounts.ts](file://convex/queries/accounts.ts#L1-L19)
- [vouchers.ts](file://convex/queries/vouchers.ts#L1-L19)
- [reminders.ts](file://convex/queries/reminders.ts#L1-L71)
- [accounts.ts](file://convex/mutations/accounts.ts#L1-L63)
- [vouchers.ts](file://convex/mutations/vouchers.ts#L1-L59)
- [reminders.ts](file://convex/mutations/reminders.ts#L1-L116)

## Detailed Component Analysis

### Daily Voucher Workflow
End-to-end process for entering and posting daily transactions:
- Select transaction date
- Add/remove rows with account, description, DR/CR fields
- Real-time totals and closing cash calculation
- Validation and posting to backend
- Navigation guard for unsaved changes

```mermaid
flowchart TD
Start(["Open Daily Voucher"]) --> PickDate["Pick Transaction Date"]
PickDate --> EditRows["Add/Edit Rows<br/>Account + Description + DR/CR"]
EditRows --> Validate{"Any Valid Row?"}
Validate --> |No| ShowError["Show Error Message"]
Validate --> |Yes| Post["Post Transactions"]
Post --> Save["Persist via Mutation"]
Save --> Reset["Load Posted Vouchers for Date"]
Reset --> End(["Done"])
ShowError --> EditRows
```

**Diagram sources**
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx#L111-L150)
- [vouchers.ts](file://convex/mutations/vouchers.ts#L1-L59)

**Section sources**
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx#L1-L336)
- [vouchers.ts](file://convex/mutations/vouchers.ts#L1-L59)

### Chart of Accounts Management
Hierarchical account structure with parent-child groups and opening balances:
- Create account groups or leaf accounts
- Set parent group and opening balances
- Prevent deletion of accounts with sub-accounts
- Fetch accounts per location (bunk)

```mermaid
classDiagram
class Account {
+string id
+string name
+string? parentId
+number openingDebit
+number openingCredit
+number createdAt
+string bunkId
}
class AccountMaster {
+handleSubmit()
+handleAddGroup()
}
AccountMaster --> Account : "creates/updates"
```

**Diagram sources**
- [AccountMaster.tsx](file://apps/pages/AccountMaster.tsx#L1-L228)
- [accounts.ts](file://convex/mutations/accounts.ts#L1-L63)
- [accounts.ts](file://convex/queries/accounts.ts#L1-L19)

**Section sources**
- [AccountMaster.tsx](file://apps/pages/AccountMaster.tsx#L1-L228)
- [accounts.ts](file://convex/mutations/accounts.ts#L1-L63)
- [accounts.ts](file://convex/queries/accounts.ts#L1-L19)
- [schema.ts](file://convex/schema.ts#L43-L54)

### Ledger Report
Consolidated ledger for a selected account or group across a date range:
- Select account (including groups)
- Choose from/to dates
- Compute opening balances across descendants
- Generate entries with running balance and export to CSV/PDF

```mermaid
sequenceDiagram
participant UI as "LedgerReport"
participant Util as "utils.calculateLedger"
participant API as "convex-api.ts"
participant Q as "queries.vouchers"
participant DB as "Convex Storage"
UI->>API : useQuery(getVouchersByBunk)
API->>Q : invoke
Q->>DB : read with index
DB-->>Q : vouchers[]
Q-->>API : vouchers[]
API-->>UI : vouchers[]
UI->>Util : calculateLedger(account, vouchers, from, to)
Util-->>UI : entries[]
UI->>UI : render and export
```

**Diagram sources**
- [LedgerReport.tsx](file://apps/pages/LedgerReport.tsx#L1-L257)
- [utils.ts](file://apps/utils.ts#L27-L64)
- [vouchers.ts](file://convex/queries/vouchers.ts#L1-L19)

**Section sources**
- [LedgerReport.tsx](file://apps/pages/LedgerReport.tsx#L1-L257)
- [utils.ts](file://apps/utils.ts#L27-L64)
- [vouchers.ts](file://convex/queries/vouchers.ts#L1-L19)

### Cash Report
Periodic cash statement with multiple filter modes:
- Daily, Monthly, YTD, Financial Year, Custom
- Opening/closing cash computation using prior balances and voucher effects
- Export to CSV/PDF and print-friendly layout

```mermaid
flowchart TD
Open(["Open Cash Report"]) --> ChooseFilter["Choose Filter Mode"]
ChooseFilter --> Apply["Apply Filter Range"]
Apply --> Compute["Compute Opening/Closing Totals"]
Compute --> Render["Render Statement"]
Render --> Export{"Export?"}
Export --> |CSV| CSV["Download CSV"]
Export --> |PDF| PDF["Print/PDF"]
Export --> |None| End(["Done"])
```

**Diagram sources**
- [CashReport.tsx](file://apps/pages/CashReport.tsx#L1-L604)

**Section sources**
- [CashReport.tsx](file://apps/pages/CashReport.tsx#L1-L604)

### Reminders and Task Management
Task and reminder lifecycle:
- Create, edit, delete reminders with title, description, reminder date, due date
- Stats: total, active (now), upcoming
- Sorting and filtering for dashboard integration

```mermaid
sequenceDiagram
participant UI as "Reminders Page"
participant API as "convex-api.ts"
participant M as "mutations.reminders"
participant Q as "queries.reminders"
participant DB as "Convex Storage"
UI->>API : useCreateReminder/useUpdateReminder/useDeleteReminder
API->>M : invoke
M->>DB : insert/update/delete
DB-->>M : ack
M-->>API : result
API-->>UI : refresh list
UI->>API : useReminders
API->>Q : getAllReminders
Q->>DB : collect
DB-->>Q : reminders[]
Q-->>API : reminders[]
API-->>UI : reminders[]
```

**Diagram sources**
- [Reminders.tsx](file://apps/pages/Reminders.tsx#L1-L388)
- [reminders.ts](file://convex/mutations/reminders.ts#L1-L116)
- [reminders.ts](file://convex/queries/reminders.ts#L1-L71)

**Section sources**
- [Reminders.tsx](file://apps/pages/Reminders.tsx#L1-L388)
- [reminders.ts](file://convex/mutations/reminders.ts#L1-L116)
- [reminders.ts](file://convex/queries/reminders.ts#L1-L71)

### Dashboard Analytics
Real-time cash KPIs, recent activity, and reminders:
- Select date (navigation)
- Compute opening, inflow, outflow, closing cash
- Group activity and average transaction value
- Reminders panel with urgency indicators

```mermaid
flowchart TD
View(["Open Dashboard"]) --> SelectDate["Select Date"]
SelectDate --> Compute["Compute KPIs and Activity"]
Compute --> ShowKPIs["Show Cash KPI Cards"]
Compute --> ShowRecent["Show Recent Activity"]
Compute --> ShowReminders["Show Active/Overdue Reminders"]
ShowKPIs --> End(["Done"])
ShowRecent --> End
ShowReminders --> End
```

**Diagram sources**
- [Dashboard.tsx](file://apps/pages/Dashboard.tsx#L1-L219)

**Section sources**
- [Dashboard.tsx](file://apps/pages/Dashboard.tsx#L1-L219)

## Dependency Analysis
Key relationships:
- Pages depend on typed Convex hooks from apps/convex-api.ts
- Queries/mutations depend on schema-defined tables and indexes
- Reports rely on shared utility functions for formatting and calculations
- Types are shared across frontend and backend contracts

```mermaid
graph LR
T["types.ts"] --> P1["DailyVoucher.tsx"]
T --> P2["AccountMaster.tsx"]
T --> P3["LedgerReport.tsx"]
T --> P4["CashReport.tsx"]
T --> P5["Reminders.tsx"]
T --> P6["Dashboard.tsx"]
U["utils.ts"] --> P1
U --> P2
U --> P3
U --> P4
U --> P5
U --> P6
C["convex-api.ts"] --> Q1["queries/accounts.ts"]
C --> Q2["queries/vouchers.ts"]
C --> Q3["queries/reminders.ts"]
C --> M1["mutations/accounts.ts"]
C --> M2["mutations/vouchers.ts"]
C --> M3["mutations/reminders.ts"]
Q1 --> S["schema.ts"]
Q2 --> S
Q3 --> S
M1 --> S
M2 --> S
M3 --> S
```

**Diagram sources**
- [types.ts](file://apps/types.ts#L1-L56)
- [utils.ts](file://apps/utils.ts#L1-L69)
- [convex-api.ts](file://apps/convex-api.ts#L1-L33)
- [accounts.ts](file://convex/queries/accounts.ts#L1-L19)
- [vouchers.ts](file://convex/queries/vouchers.ts#L1-L19)
- [reminders.ts](file://convex/queries/reminders.ts#L1-L71)
- [accounts.ts](file://convex/mutations/accounts.ts#L1-L63)
- [vouchers.ts](file://convex/mutations/vouchers.ts#L1-L59)
- [reminders.ts](file://convex/mutations/reminders.ts#L1-L116)
- [schema.ts](file://convex/schema.ts#L1-L85)

**Section sources**
- [types.ts](file://apps/types.ts#L1-L56)
- [utils.ts](file://apps/utils.ts#L1-L69)
- [convex-api.ts](file://apps/convex-api.ts#L1-L33)
- [schema.ts](file://convex/schema.ts#L1-L85)

## Performance Considerations
- Indexes: Queries leverage indexes (e.g., by_bunk, by_parent, by_bunk_and_date, by_due_date) to reduce scan costs.
- Memoization: Frontend pages use useMemo for derived computations (totals, report data) to avoid unnecessary re-computation.
- Sorting and filtering: Reports sort and filter in-memory; consider pagination or server-side aggregation for very large datasets.
- Rendering: Large tables are paginated via scroll containers; virtualization could further improve performance for thousands of rows.
- Network: Use optimistic updates with proper error rollback for mutations to improve perceived latency.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Posting empty rows: The daily voucher validates that at least one row has a valid account and either DR or CR amount before posting.
- Deleting posted transactions: Confirmation dialog prevents accidental deletions; ensure you have backups or audit logs if needed.
- Unsafely navigating away: A hashchange listener prompts to save or cancel navigation when there are unsaved changes.
- Reminder date validation: Mutations enforce non-empty title and valid date formats (YYYY-MM-DD).
- Account deletion: Cannot delete an account that has sub-accounts; remove children first.

**Section sources**
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx#L111-L150)
- [DailyVoucher.tsx](file://apps/pages/DailyVoucher.tsx#L165-L190)
- [reminders.ts](file://convex/mutations/reminders.ts#L23-L34)
- [accounts.ts](file://convex/mutations/accounts.ts#L50-L57)

## Conclusion
KR-FUELS delivers a cohesive set of core features tailored for fuel station accounting and operations:
- Robust daily voucher processing with real-time validation and cash tally logic
- Flexible hierarchical chart of accounts with opening balances
- Comprehensive financial reporting with export capabilities
- Practical reminders and task management
- Insightful dashboard analytics

The architecture cleanly separates concerns with typed Convex APIs, shared types, and utility functions, enabling maintainability and extensibility.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Data Model Overview
```mermaid
erDiagram
BUNKS {
string id PK
string name
string code
string location
number createdAt
}
USERS {
string username PK
string passwordHash
string name
enum role
number createdAt
}
USER_BUNK_ACCESS {
string userId FK
string bunkId FK
}
ACCOUNTS {
string id PK
string name
string parentId FK
number openingDebit
number openingCredit
string bunkId FK
number createdAt
}
VOUCHERS {
string id PK
string date
string accountId FK
number debit
number credit
string description
string bunkId FK
number createdAt
}
REMINDERS {
string id PK
string title
string description
string reminderDate
string dueDate
string createdBy
number createdAt
}
BUNKS ||--o{ ACCOUNTS : "has"
BUNKS ||--o{ VOUCHERS : "has"
USERS ||--o{ USER_BUNK_ACCESS : "has"
BUNKS ||--o{ USER_BUNK_ACCESS : "has"
ACCOUNTS ||--o{ VOUCHERS : "records"
ACCOUNTS ||--o{ ACCOUNTS : "parent-child"
```

**Diagram sources**
- [schema.ts](file://convex/schema.ts#L11-L84)

### UI Interaction Patterns
- Modal dialogs for adding/editing reminders and creating account groups
- Sticky headers for filters and summary cards
- Hover actions on table rows (edit/delete)
- Print-friendly layouts for reports
- Date pickers with fallbacks for cross-browser compatibility

**Section sources**
- [Reminders.tsx](file://apps/pages/Reminders.tsx#L191-L382)
- [AccountMaster.tsx](file://apps/pages/AccountMaster.tsx#L89-L136)
- [CashReport.tsx](file://apps/pages/CashReport.tsx#L339-L503)
- [LedgerReport.tsx](file://apps/pages/LedgerReport.tsx#L136-L191)