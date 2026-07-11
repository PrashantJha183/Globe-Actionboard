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
---

## Project Structure

```text
ActionBoard
│
├── services
│   └── ActionBoardService.cs
│
├── styles
│   └── action-board.css
│
├── controllers
│   ├── ActionBoardController.cs
│   └── ActionBoardItemInfoTableController.cs
│
├── models
│   └── ActionBoardModels.cs
│
├── scripts
│   └── action-board.js
│
└── views
    ├── ActionBoardView.cshtml
    ├── ActionBoardItemInfoTableView.cshtml
    └── ActionBoardLoading.cshtml
```

### Key Components

| Component | Responsibility |
|:----------|:---------------|
| `action-board.js` | Client-side interactions, AJAX, pagination, report panel, theme switching, and notifications. |
| `action-board.css` | Dashboard styling, themes, responsive layout, shimmer loading, and pagination. |
| `ActionBoardController.cs` | Handles dashboard requests and report navigation. |
| `ActionBoardService.cs` | Contains the application's business logic. |
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

# Theme Initialization Flow

```text
Browser Loads JavaScript
          │
          ▼
FOWT IIFE Executes
          │
          ▼
Reads Theme from localStorage
          │
          ▼
Sets

<html data-theme="light|dark">

          │
          ▼
CSS Loads Correct Theme
```

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


