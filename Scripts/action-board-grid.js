/* ==========================================
   action-board-grid.js
   Grid view helpers used by the standalone
   ActionBoardItemInfoTableView (loaded in the
   report panel iframe). Handles client-side
   row pagination, action-button link
   enhancement, and the AddUrlByLinkId global
   function.
   Depends on: action-board-core.js (namespace)
   ========================================== */

(function ($) {
    'use strict';

    /* ==========================================
       CLIENT-SIDE GRID PAGINATION
       ========================================== */

    /* ------------------------------------------
       OLD initGridPagination() — KEPT FOR REFERENCE,
       COMMENTED OUT. DO NOT DELETE.
       Original behaviour: reads all <tbody> rows once
       into a flat array, hides all but the first
       PAGE_SIZE, and exposes getRowCount() / goToPage()
       on the window for the parent frame.
       Limitation that motivated the rewrite below:
       getRowCount() returned the ORIGINAL total, so
       the parent frame's page buttons never reflected a
       filtered row set. Replaced by the filter-aware
       version further down this file.
       ------------------------------------------
    // ActionBoard.initGridPagination = function initGridPagination() {
    //     var PAGE_SIZE = 15;
    //     var allRows = [];
    //     var tables = document.querySelectorAll('.tt-grid-table');
    //     for (var t = 0; t < tables.length; t++) {
    //         var tbodyRows = tables[t].querySelectorAll('tbody tr');
    //         for (var r = 0; r < tbodyRows.length; r++) {
    //             allRows.push(tbodyRows[r]);
    //         }
    //     }
    //     var total = allRows.length;
    //     var totalPages = Math.ceil(total / PAGE_SIZE);
    //     if (totalPages <= 1) return;
    //
    //     var currentPage = 1;
    //
    //     function hideAll() {
    //         for (var i = 0; i < allRows.length; i++) {
    //             allRows[i].style.display = 'none';
    //         }
    //     }
    //
    //     function showPage(page) {
    //         var start = (page - 1) * PAGE_SIZE;
    //         var end = start + PAGE_SIZE;
    //         for (var k = start; k < end && k < total; k++) {
    //             allRows[k].style.display = '';
    //         }
    //     }
    //
    //     hideAll();
    //     showPage(currentPage);
    //
    //     window.getRowCount = function () { return total; };
    //     window.goToPage = function (page) {
    //         if (page < 1 || page > totalPages || page === currentPage) return;
    //         currentPage = page;
    //         hideAll();
    //         showPage(currentPage);
    //     };
    // };

    /* ==========================================
       GRID SEARCH STATE + FILTER HELPERS
       Shared by initGridPagination (new) and
       initGridSearch below.
       ========================================== */
    var gridState = { term: '', rows: [], visible: [], page: 1, pageSize: 20, timer: null };

    /* collectRows() — re-reads every <tbody> row from all
       .tt-grid-table elements. Called on each filter pass
       so the row list is never stale. */
    function collectRows() {
        var out = [];
        var tables = document.querySelectorAll('.tt-grid-table');
        for (var t = 0; t < tables.length; t++) {
            var trs = tables[t].querySelectorAll('tbody tr');
            for (var r = 0; r < trs.length; r++) {
                out.push(trs[r]);
            }
        }
        return out;
    }

    /* rowText(tr) — concatenates every <td>'s textContent
       into one lowercased string so a single indexOf test
       matches across all columns at once. */
    function rowText(tr) {
        var tds = tr.querySelectorAll('td');
        var parts = [];
        for (var i = 0; i < tds.length; i++) {
            parts.push(tds[i].textContent || '');
        }
        return parts.join(' ').toLowerCase();
    }

    /* OLD renderRows() — KEPT FOR REFERENCE,
       COMMENTED OUT. DO NOT DELETE.
       Showed/hid rows by toggling style.display with no
       animation, so filtering snapped the new result set
       into place and read as jitter. The version below
       adds a reveal class for one cycle.
       ------------------------------------------
    // function renderRows() {
    //     var i;
    //     for (i = 0; i < gridState.rows.length; i++) {
    //         gridState.rows[i].style.display = 'none';
    //     }
    //     var start = (gridState.page - 1) * gridState.pageSize;
    //     var end = start + gridState.pageSize;
    //     for (i = start; i < end && i < gridState.visible.length; i++) {
    //         gridState.visible[i].style.display = '';
    //     }
    // }

    /* renderRows() — hides every known row, then reveals
       only the current page slice of the visible set.
       Newly shown rows get .tt-row-reveal for one cycle so
       they fade up in the same motion as .tt-card
       (tt-card-enter), staggered to match. The class is
       stripped in the hide loop so the animation can
       restart on the next filter instead of sticking in
       its end state. */
    function renderRows() {
        var i;
        for (i = 0; i < gridState.rows.length; i++) {
            gridState.rows[i].style.display = 'none';
            gridState.rows[i].classList.remove('tt-row-reveal');
        }
        var start = (gridState.page - 1) * gridState.pageSize;
        var end = start + gridState.pageSize;
        for (i = start; i < end && i < gridState.visible.length; i++) {
            var row = gridState.visible[i];
            row.style.display = '';
            row.style.animationDelay = (i - start) * 0.02 + 's';
            row.classList.add('tt-row-reveal');
        }
    }

    /* updateCount() — writes the "N of M rows" label next to
       the search box. */
    function updateCount() {
        var el = document.getElementById('ttGridSearchCount');
        if (!el) return;
        el.textContent = gridState.term
            ? gridState.visible.length + ' of ' + gridState.rows.length + ' rows'
            : gridState.rows.length + ' rows';
    }

    /* applyFilter() — recomputes the visible set from the
       current search term and resets to page 1. */
    function applyFilter() {
        gridState.rows = collectRows();
        if (!gridState.term) {
            gridState.visible = gridState.rows.slice();
        } else {
            gridState.visible = [];
            for (var i = 0; i < gridState.rows.length; i++) {
                if (rowText(gridState.rows[i]).indexOf(gridState.term) !== -1) {
                    gridState.visible.push(gridState.rows[i]);
                }
            }
        }
        gridState.page = 1;
        renderRows();
        updateCount();
    }

    /* ------------------------------------------
       initGridPagination() — NEW, filter-aware
       replacement for the commented-out original
       above. Exposes the same getRowCount() / goToPage()
       names the parent frame expects, but getRowCount()
       now returns the CURRENTLY VISIBLE count, so
       action-board-report.js initFramePagination()
       computes page buttons from the filtered set with
       no changes needed on the parent side.

       Behaviour note: the original bailed out early via
       "if (totalPages <= 1) return;" so it defined no
       getRowCount for 15 or fewer rows. This version
       always defines it. Net behaviour is the same,
       because initFramePagination clears its container
       when totalPages <= 1.
       ------------------------------------------ */
    ActionBoard.initGridPagination = function initGridPagination() {
        try {
            gridState.term = '';
            applyFilter();
            window.getRowCount = function () { return gridState.visible.length; };
            window.goToPage = function (page) {
                var totalPages = Math.ceil(gridState.visible.length / gridState.pageSize);
                if (page < 1 || page > totalPages || page === gridState.page) return;
                gridState.page = page;
                renderRows();
            };
        } catch (e) { }
    };

    /* ------------------------------------------
       initGridSearch() — binds the toolbar search input
       with a 300ms debounce (clearTimeout before each new
       setTimeout). Filters rows across every column using
       a case-insensitive substring match, then notifies
       the parent frame so its page buttons stay in sync
       with the new filtered count.
       ------------------------------------------ */
    ActionBoard.initGridSearch = function initGridSearch() {
        try {
            var input = document.getElementById('ttGridSearch');
            if (!input) return;

            function run() {
                gridState.term = (input.value || '').trim().toLowerCase();
                applyFilter();
                try {
                    if (window.parent && window.parent.ActionBoard
                        && window.parent.ActionBoard.refreshPagination) {
                        window.parent.ActionBoard.refreshPagination();
                    }
                } catch (e) { }
            }

            input.addEventListener('input', function () {
                clearTimeout(gridState.timer);
                gridState.timer = setTimeout(run, 300);
            });

            var clear = document.getElementById('ttGridSearchClear');
            if (clear) {
                clear.addEventListener('click', function () {
                    clearTimeout(gridState.timer);
                    input.value = '';
                    run();
                });
            }
        } catch (e) { }
    };

    /* ==========================================
       EXCEL EXPORT
       Writes every .tt-grid-table on the page to a
       real .xlsx via SheetJS (scripts/xlsx.mini.min.js).
       Exports ALL rows, not just the current search
       result — the search box is a view filter only.
       One worksheet per table.
       ========================================== */

    /* ------------------------------------------
       exportFileName() — the download name.
       Fixed constant: the file is always Fleet.xlsx.
       SheetJS does NOT append an extension in the
       browser save path, so the full name including
       .xlsx is passed by initGridExport().
       Kept as a function (rather than inlined) so the
       name lives in exactly one place.
       ------------------------------------------ */
    function exportFileName() {
        return 'Fleet';
    }

    /* ------------------------------------------
       toNumeric(v) — decides whether a cell's text is
       really a number, so Excel can sum and sort it.
       Every value here arrives as a string from
       textContent, and SheetJS's aoa_to_sheet() leaves
       strings as text, so this conversion is what makes
       amounts numeric.
       Returns a JS number, or the original string when
       the value must stay text. Deliberately refuses:
         - leading zeros  (007 would become 7)
         - a leading +    (+9198... is a phone number)
         - currency symbols and separators
         - more than 15 digits (would lose precision,
           and long IDs turn into 1.23E+18)
       ------------------------------------------ */
    function toNumeric(v) {
        if (typeof v === 'number') return v;
        if (typeof v !== 'string') return v;

        var s = v.trim();
        if (!s) return v;

        /* optional minus, then either plain digits or
           digits with thousands separators */
        if (!/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) {
            return v;
        }

        /* a leading zero in the INTEGER part means the
           digits are an identifier (007, 01234), not a
           quantity. Only the part before the decimal is
           examined, otherwise 0.75 would look like 075
           and every value under 1 would be kept as text. */
        var intPart = s.replace(/^-/, '').split('.')[0];
        if (intPart.length > 1 && intPart.charAt(0) === '0') return v;

        /* Excel stores 15 significant digits; anything
           longer cannot be represented faithfully */
        var digits = s.replace(/[-,.]/g, '');
        if (digits.replace(/^-/, '').length > 15) return v;

        var n = parseFloat(s.replace(/,/g, ''));
        return isNaN(n) ? v : n;
    }

    /* ------------------------------------------
       Columns that must NOT appear in the download.
       'addurl' is a synthetic column added server-side
       (ActionBoardController.cs builds a ReportColumn
       with TableColumnName/DisplayColumnName = "AddUrl").
       On screen its cell holds an action link and is
       styled into the blue + button, which is useful
       there but meaningless in a spreadsheet. The column
       stays in the grid; only the export drops it.
       Matched against the normalised header text, so
       "AddUrl", "addurl" and "Add URL" all match.
       Add further names here to exclude more columns.
       ------------------------------------------ */
    var EXPORT_EXCLUDED_COLUMNS = ['addurl'];

    function isExcludedColumn(headerText) {
        var key = String(headerText || '').toLowerCase().replace(/\s+/g, '');
        return EXPORT_EXCLUDED_COLUMNS.indexOf(key) !== -1;
    }

    /* ------------------------------------------
       excludedColumnIndexes(table) — positions of the
       columns to skip, derived from the header row.
       Positions (not names) are used when building the
       export so that no other column shifts left when one
       is dropped.
       ------------------------------------------ */
    function excludedColumnIndexes(table) {
        var skip = [];
        var rows = table.querySelectorAll('tr');
        if (!rows.length) return skip;
        var head = rows[0].querySelectorAll('th, td');
        for (var h = 0; h < head.length; h++) {
            if (isExcludedColumn(head[h].textContent)) skip.push(h);
        }
        return skip;
    }

    /* ------------------------------------------
       tableToAoa(table) — reads a <table> into a
       two-dimensional array. Header row becomes the
       first entry. Uses textContent, so any markup
       inside a cell (the view writes cells with
       Html.Raw) is reduced to its text rather than
       being exported as tags. Cell values are passed
       through toNumeric() so numbers stay numbers.
       Columns listed in EXPORT_EXCLUDED_COLUMNS are
       skipped in every row. Returns an empty array when
       the table has no columns left to export, so the
       caller can skip it rather than emit a broken sheet.
       ------------------------------------------ */
    function tableToAoa(table, skip) {
        var aoa = [];
        if (!skip) skip = excludedColumnIndexes(table);
        var rows = table.querySelectorAll('tr');
        for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('th, td');
            if (!cells.length) continue;
            var line = [];
            for (var c = 0; c < cells.length; c++) {
                if (skip.indexOf(c) !== -1) continue;
                var text = (cells[c].textContent || '').replace(/\s+/g, ' ').trim();
                /* header row is always text */
                line.push(r === 0 ? text : toNumeric(text));
            }
            if (line.length) aoa.push(line);
        }
        return aoa;
    }

    /* ------------------------------------------
       sheetNameFor(table, index, skip) — worksheet names
       are capped at 31 characters and cannot contain
       : \ / ? * [ ]. These tables have no <caption>
       and no id, so the first surviving header cell is
       the best available description. Excluded columns
       are passed over so a dropped first column cannot
       still name the tab. Falls back to Table1, Table2...
       ------------------------------------------ */
    function sheetNameFor(table, index, skip) {
        var ths = table.querySelectorAll('thead th');
        var name = '';
        for (var t = 0; t < ths.length; t++) {
            if (skip && skip.indexOf(t) !== -1) continue;
            name = (ths[t].textContent || '').trim();
            if (name) break;
        }
        if (!name) {
            var cap = table.querySelector('caption');
            name = cap ? (cap.textContent || '').trim() : '';
        }
        if (!name && table.id) name = table.id;
        name = name.replace(/[:\\\/?*[\]]/g, '').replace(/\s+/g, ' ').trim();
        if (!name) name = 'Table' + (index + 1);
        if (name.length > 31) name = name.substring(0, 31);
        return name;
    }

    /* ------------------------------------------
       initGridExport() — binds #ttGridExport. On click
       reads every .tt-grid-table, builds a workbook with
       one sheet per table, and triggers the download.
       Silently does nothing when SheetJS failed to load,
       so a missing library can never break the page.
       ------------------------------------------ */
    ActionBoard.initGridExport = function initGridExport() {
        try {
            var btn = document.getElementById('ttGridExport');
            if (!btn) return;

            /* keep the tooltip honest about the real name */
            btn.setAttribute('title', 'Download this report as ' + exportFileName() + '.xlsx');

            function run() {
                if (typeof XLSX === 'undefined' || !XLSX.utils) return;

                var tables = document.querySelectorAll('.tt-grid-table');
                if (!tables.length) return;

                try {
                    var wb = XLSX.utils.book_new();
                    var added = 0;
                    for (var t = 0; t < tables.length; t++) {
                        var skip = excludedColumnIndexes(tables[t]);
                        var aoa = tableToAoa(tables[t], skip);
                        if (!aoa.length) continue;
                        var ws = XLSX.utils.aoa_to_sheet(aoa);
                        XLSX.utils.book_append_sheet(wb, ws, sheetNameFor(tables[t], t, skip));
                        added++;
                    }
                    if (!added) return;
                    XLSX.writeFile(wb, exportFileName() + '.xlsx');
                } catch (e) { }
            }

            btn.addEventListener('click', function () {
                btn.disabled = true;
                /* yield a frame so the disabled state paints
                   before the synchronous sheet build. */
                setTimeout(function () {
                    try { run(); } finally { btn.disabled = false; }
                }, 0);
            });
        } catch (e) { }
    };

    /* ==========================================
       ACTION BUTTON LINK ENHANCEMENT
       ========================================== */

    /* ------------------------------------------
       OLD addUrlByLinkId() — KEPT FOR REFERENCE,
       COMMENTED OUT. DO NOT DELETE.
       Original behaviour: fetched the URL and opened the
       popup unconditionally. Limitation that motivated
       the rewrite below: the response was never checked,
       so a failed request produced data.itemUrl ===
       undefined, which made Window.js build an iframe
       with src="undefined". The browser then requested
       /undefined and MVC logged "did not return a
       controller for the name 'undefined'" — masking the
       real server error underneath.
       ------------------------------------------
    // ActionBoard.addUrlByLinkId = function addUrlByLinkId(linkId) {
    //     var endpoint = window._addUrlByLinkIdEndpoint || '';
    //     $.ajax({
    //         url: endpoint,
    //         type: 'GET',
    //         data: { linkId: linkId },
    //         dataType: 'json',
    //         success: function (data) {
    //             self.parent.parent.OpenWindow(data.itemName, data.itemId, '300', '500', data.itemUrl, 'Images/icons/icon_16_disc.png');
    //         }
    //     });
    // };

    /* ------------------------------------------
       addUrlByLinkId() — fetches a URL from the server
       and opens it in a popup window. Used by grid action
       buttons that need to dynamically resolve the target
       URL. Now guards the response so a failure shows a
       toast instead of opening a window pointed at
       "undefined".
       ------------------------------------------ */
    ActionBoard.addUrlByLinkId = function addUrlByLinkId(linkId) {
        var endpoint = window._addUrlByLinkIdEndpoint || '';
        $.ajax({
            url: endpoint,
            type: 'GET',
            data: { linkId: linkId },
            dataType: 'json',
            success: function (data) {
                if (!data || data.success === false || !data.itemUrl) {
                    ActionBoard.showToast((data && data.message) || 'Unable to open the form.', 'error');
                    return;
                }
                self.parent.parent.OpenWindow(data.itemName, data.itemId, '300', '500', data.itemUrl, 'Images/icons/icon_16_disc.png');
            },
            error: function () {
                ActionBoard.showToast('Unable to resolve the form URL.', 'error');
            }
        });
    };

    /* Expose as a global function for inline onclick use in grid tables. */
    window.AddUrlByLinkId = function (linkId) {
        ActionBoard.addUrlByLinkId(linkId);
    };

    /* ------------------------------------------
       enhanceGridActionButtons() — finds anchor
       tags inside grid tables that have an
       onclick calling AddUrlByLinkId, adds a
       styled class and a plus icon for a better
       visual appearance.
       ------------------------------------------ */
    ActionBoard.enhanceGridActionButtons = function enhanceGridActionButtons() {
        try {
            $('.tt-grid-table td a[onclick]').each(function () {
                var $a = $(this);
                if ($a.attr('onclick').indexOf('AddUrlByLinkId') !== -1) {
                    $a.addClass('tt-grid-action-btn');
                    $a.prepend('<i class="fa fa-plus-circle"></i> ');
                }
            });
        } catch (e) { }
    };

    /* ------------------------------------------
       OLD _cleanupGrid() — KEPT FOR REFERENCE,
       COMMENTED OUT. DO NOT DELETE.
       Did not clear the debounce timer or reset the
       gridState object, both of which the version below
       now handles.
       ------------------------------------------
    // ActionBoard._cleanupGrid = function _cleanupGrid() {
    //     try {
    //         delete window.getRowCount;
    //         delete window.goToPage;
    //         delete window.AddUrlByLinkId;
    //         delete window._addUrlByLinkIdEndpoint;
    //     } catch (e) { }
    // };

    /* ------------------------------------------
       _cleanupGrid() — removes global functions
       and variables added for grid pagination,
       search, and action buttons. Also clears the
       pending debounce timer and resets gridState so
       a destroyed module cannot fire a filter against a
       detached DOM. Called by ActionBoard.destroy().
       ------------------------------------------ */
    ActionBoard._cleanupGrid = function _cleanupGrid() {
        try {
            clearTimeout(gridState.timer);
            gridState.term = '';
            gridState.rows = [];
            gridState.visible = [];
            gridState.page = 1;
            delete window.getRowCount;
            delete window.goToPage;
            delete window.AddUrlByLinkId;
            delete window._addUrlByLinkIdEndpoint;
        } catch (e) { }
    };

})(jQuery);
