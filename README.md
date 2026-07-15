# ActionBoard

A modern **dashboard UI component** for displaying and managing actionable tasks in a responsive card-based grid layout.

Built with **jQuery** and designed for seamless integration into **ASP.NET MVC** applications.

---
## Features

| Feature | Description | Benefit |
|:--------|:------------|:--------|
| Card Grid | Responsive dashboard cards with icons and counts. | Quick overview of pending actions. |
| Theme Switching | Light and Dark themes with preference persistence. | Improved user experience. |
| Report Panel | Slide-in iframe for workflow reports. | Keeps users on the dashboard. |
| Pagination | Client-side paging for report tables. | Faster navigation through large datasets. |
| Shimmer Loading | Skeleton placeholders during data fetch. | Better perceived performance. |
| Toast Notifications | Non-intrusive status messages. | Clear user feedback. |
| Tab Navigation | Category-based dashboard organization. | Easier access to workflows. |
| Error Handling | Retry mechanism with informative messages. | Improved reliability. |
| Refresh Button | Per-group card refresh with cooldown timer based on `Frequency` column. | Always up-to-date data without full page reload. |
---

**Full technical documentation:** [Action Board Dashboard — Notion](https://app.notion.com/p/Action-Board-Dashboard-38a94ea95aab80d2a580cdd6f0e53b3b)

## Project Structure

```text
_ActionBoard/
│
├── controllers/
│   ├── ActionBoardController.cs
│   └── ActionBoardItemInfoTableController.cs
│
├── models/
│   └── ActionBoardModels.cs
│
├── services/
│   └── ActionBoardService.cs
│
├── scripts/
│   ├── action-board-core.js      (namespace, utilities, destroy)
│   ├── action-board-theme.js     (theme switching)
│   ├── action-board-cards.js     (card grid, tabs, report panel, refresh with cooldown)
│   ├── action-board-report.js    (iframe pagination)
│   ├── action-board-grid.js      (grid pagination, action buttons)
│   └── action-board.js           (deprecated — kept on disk)
│
├── styles/
│   ├── action-board-common.css   (reset, variables, theme, shimmer, toast, color themes)
│   ├── action-board-cards.css    (header, tabs, card grid, cards, skeleton, error)
│   ├── action-board-report.css   (report panel, pagination, table skeleton)
│   ├── action-board-table.css    (grid table, pagination, action buttons)
│   └── action-board.css          (deprecated — kept on disk)
│
├── views/
│   ├── ActionBoardView.cshtml
│   ├── ActionBoardItemInfoTableView.cshtml
│   └── ActionBoardLoading.cshtml
│
├── README.md
└── LICENSE
```

### Key Components

| Component | Responsibility |
|:----------|:---------------|
| `action-board-core.js` | Namespace, FOWT prevention, hexToRgb, showToast, destroy |
| `action-board-theme.js` | Dark/light theme switching, persistence, sync to iframe |
| `action-board-cards.js` | Tab navigation, card grid, skeleton loading, report panel, per-group refresh with cooldown |
| `action-board-report.js` | Iframe pagination, page range, prev/next controls |
| `action-board-grid.js` | Client-side grid pagination, action button enhancement |
| `action-board-common.css` | CSS reset, theme variables, shimmer animation, toast styling |
| `action-board-cards.css` | Header, tabs, card grid, cards, skeleton, error, empty state |
| `action-board-report.css` | Report panel, pagination, table skeleton, iframe transition |
| `action-board-table.css` | Grid table, pagination, empty state, action buttons |
| `ActionBoardController.cs` | Dashboard requests, report navigation, form links, path routing |
| `ActionBoardService.cs` | Business logic, DB queries (GetCards, GetNavigationTabs, Frequency) |
---

# Architecture

```text
┌──────────────┐
│ User Clicks  │
│ Dashboard    │
│ Card         │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AJAX Request │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────────────┐
│ ActionBoardController                      │
│ RunWorkFlowApproval()                      │
└──────┬─────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Returns Report URL           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Opens Report View in iframe  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Parent Page Controls         │
│ • Pagination                 │
│ • Row Count                  │
│ • Navigation                 │
└──────────────────────────────┘
```

---

## Refresh Button

A per-group refresh button in the header with cooldown timer.

| Aspect | Detail |
|--------|--------|
| **Location** | Header before theme toggle (`#refreshBtn`) |
| **Cooldown** | `min(Frequency of active tab's cards) / 4` minutes (default 5) |
| **Storage** | Per-group `localStorage` key: `ab_lastRefresh_{groupId}` |
| **Locked click** | Toast with 3500ms dismiss timer (resets on spam click) |
| **Toast messages** | "Next refresh in 1h 15m" / "Refresh ready" |
| **CSS** | `var(--text-primary)` color, `0.35` opacity when disabled |
| **Frequency field** | `PendingTaskCard.Frequency`, fetched from `ActionBoardConfig.Frequency` |
| **JS functions** | `bindRefreshButton()`, `updateRefreshButtonState()`, `getRefreshCooldownMs()`, `formatDuration()` |

---

# Technology Stack

| Category | Technology |
|-----------|------------|
| Backend | ASP.NET MVC |
| Frontend | jQuery |
| Styling | CSS3 |
| Database | SQL Server |
| Language | C# |
| UI | HTML5 |




## Getting Started

### Prerequisites

-   Visual Studio 2017 or later
-   .NET Framework 4.6.1+ or .NET Core 3.1+
-   SQL Server
-   jQuery

### Clone Repository

``` bash
git clone https://github.com/PrashantJha183/ActionBoard
```

### Build & Run

1.  Open the solution in Visual Studio.
2.  Restore NuGet packages.
3.  Configure the SQL Server connection.
4.  Build the solution.
5.  Press **F5**.

------------------------------------------------------------------------

## Contributing

1.  Fork the repository.
2.  Create a branch:

``` bash
git checkout -b feature/your-feature
```

3.  Commit changes:

``` bash
git commit -m "Add your feature"
```

4.  Push:

``` bash
git push origin feature/your-feature
```

5.  Open a Pull Request.

Please follow the existing coding style and avoid unnecessary inline
`<script>` blocks.


