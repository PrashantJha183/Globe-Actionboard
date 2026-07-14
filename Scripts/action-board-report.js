/* ==========================================
   action-board-report.js
   Report panel iframe pagination — initialises
   page controls for the grid table loaded
   inside the report panel iframe. Reads
   getRowCount / goToPage from the iframe
   window and renders prev/next buttons.
   Depends on: action-board-core.js (namespace)
   ========================================== */

(function ($) {
    'use strict';

    /* ==========================================
       IFRAME PAGINATION
       ========================================== */

    /* ------------------------------------------
       buildPageRange(current, total) — generates
       a compact page-number array with ellipsis
       for large page counts (e.g. 1 ... 4 5 6 ... 10).
       ------------------------------------------ */
    function buildPageRange(current, total) {
        if (total <= 7) {
            var all = [];
            for (var i = 1; i <= total; i++) all.push(i);
            return all;
        }
        var pages = [];
        pages.push(1);
        if (current > 3) pages.push('...');
        var start = Math.max(2, current - 1);
        var end = Math.min(total - 1, current + 1);
        for (var j = start; j <= end; j++) pages.push(j);
        if (current < total - 2) pages.push('...');
        pages.push(total);
        return pages;
    }

    /* ------------------------------------------
       renderPagination(container, state) —
       builds the prev/next + page-number HTML
       and injects it into the container.
       state: { currentPage, totalPages }
       ------------------------------------------ */
    function renderPagination(container, state) {
        var page = state.currentPage;
        var total = state.totalPages;
        var html = '<button class="tt-grid-page-arrow" data-dir="prev"' + (page === 1 ? ' disabled' : '') + '>&#8249; Prev</button>';
        var pages = buildPageRange(page, total);
        for (var i = 0; i < pages.length; i++) {
            if (pages[i] === '...') {
                html += '<span class="tt-grid-page-dots">...</span>';
            } else {
                html += '<button class="tt-grid-page-btn' + (pages[i] === page ? ' tt-active' : '') + '" data-page="' + pages[i] + '">' + pages[i] + '</button>';
            }
        }
        html += '<button class="tt-grid-page-arrow" data-dir="next"' + (page === total ? ' disabled' : '') + '>Next &#8250;</button>';
        container.innerHTML = html;
    }

    /* ------------------------------------------
       initFramePagination() — called after the
       report iframe finishes loading. Detects
       the iframe's getRowCount function, creates
       pagination controls, and wires click
       handlers for prev/next/page buttons.
       Does nothing if there is only 1 page.
       ------------------------------------------ */
    ActionBoard.initFramePagination = function initFramePagination() {
        try {
            var PAGE_SIZE = 15;
            var frame = document.getElementById('panelReportFrame');
            var container = document.getElementById('ttPagination');
            if (!frame || !frame.contentWindow || !container) return;
            var win = frame.contentWindow;
            if (typeof win.getRowCount !== 'function') { container.innerHTML = ''; return; }
            var totalRows = win.getRowCount();
            var totalPages = Math.ceil(totalRows / PAGE_SIZE);
            if (totalPages <= 1) { container.innerHTML = ''; return; }
            var state = { currentPage: 1, totalPages: totalPages };
            renderPagination(container, state);
            container.onclick = null;
            container.onclick = function (e) {
                var btn = e.target;
                if (btn.classList.contains('tt-grid-page-arrow')) {
                    var dir = btn.getAttribute('data-dir');
                    if (dir === 'prev' && state.currentPage > 1) state.currentPage--;
                    else if (dir === 'next' && state.currentPage < state.totalPages) state.currentPage++;
                    else return;
                } else if (btn.classList.contains('tt-grid-page-btn')) {
                    var page = parseInt(btn.getAttribute('data-page'));
                    if (isNaN(page) || page === state.currentPage) return;
                    state.currentPage = page;
                } else {
                    return;
                }
                win.goToPage(state.currentPage);
                renderPagination(container, state);
            };
        } catch (e) { }
    };

})(jQuery);
