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
       initGridPagination() — reads all <tbody>
       rows from .tt-grid-table elements, hides
       all but the first PAGE_SIZE rows, and
       exposes getRowCount() / goToPage() on
       the window object for the parent frame's
       pagination controls.
       ------------------------------------------ */
    ActionBoard.initGridPagination = function initGridPagination() {
        var PAGE_SIZE = 15;
        var allRows = [];
        var tables = document.querySelectorAll('.tt-grid-table');
        for (var t = 0; t < tables.length; t++) {
            var tbodyRows = tables[t].querySelectorAll('tbody tr');
            for (var r = 0; r < tbodyRows.length; r++) {
                allRows.push(tbodyRows[r]);
            }
        }
        var total = allRows.length;
        var totalPages = Math.ceil(total / PAGE_SIZE);
        if (totalPages <= 1) return;

        var currentPage = 1;

        function hideAll() {
            for (var i = 0; i < allRows.length; i++) {
                allRows[i].style.display = 'none';
            }
        }

        function showPage(page) {
            var start = (page - 1) * PAGE_SIZE;
            var end = start + PAGE_SIZE;
            for (var k = start; k < end && k < total; k++) {
                allRows[k].style.display = '';
            }
        }

        hideAll();
        showPage(currentPage);

        window.getRowCount = function () { return total; };
        window.goToPage = function (page) {
            if (page < 1 || page > totalPages || page === currentPage) return;
            currentPage = page;
            hideAll();
            showPage(currentPage);
        };
    };

    /* ==========================================
       ACTION BUTTON LINK ENHANCEMENT
       ========================================== */

    /* ------------------------------------------
       addUrlByLinkId(linkId) — fetches a URL
       from the server and opens it in a popup
       window. Used by grid action buttons that
       need to dynamically resolve the target URL.
       ------------------------------------------ */
    ActionBoard.addUrlByLinkId = function addUrlByLinkId(linkId) {
        var endpoint = window._addUrlByLinkIdEndpoint || '';
        $.ajax({
            url: endpoint,
            type: 'GET',
            data: { linkId: linkId },
            dataType: 'json',
            success: function (data) {
                self.parent.parent.OpenWindow(data.itemName, data.itemId, '300', '500', data.itemUrl, 'Images/icons/icon_16_disc.png');
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
       _cleanupGrid() — removes global functions
       and variables added for grid pagination
       and action buttons. Called by ActionBoard.destroy().
       ------------------------------------------ */
    ActionBoard._cleanupGrid = function _cleanupGrid() {
        try {
            delete window.getRowCount;
            delete window.goToPage;
            delete window.AddUrlByLinkId;
            delete window._addUrlByLinkIdEndpoint;
        } catch (e) { }
    };

})(jQuery);
