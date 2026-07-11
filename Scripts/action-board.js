(function () {
    try {
        var t = localStorage.getItem('tt-theme');
        document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    } catch (e) { }
})();

var ActionBoard = (function ($) {
    var baseUrl = '';
    var retryCount = 0;
    var maxRetries = 3;

    function hexToRgb(hex) {
        if (!hex || hex.charAt(0) !== '#') return null;
        var h = hex.replace('#', '');
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        var r = parseInt(h.substring(0, 2), 16);
        var g = parseInt(h.substring(2, 4), 16);
        var b = parseInt(h.substring(4, 6), 16);
        return r + ',' + g + ',' + b;
    }

    function showToast(message, type) {
        try {
            var container = document.getElementById('ttToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'ttToastContainer';
                document.body.appendChild(container);
            }
            var toast = document.createElement('div');
            toast.className = 'tt-toast tt-toast-' + (type || 'info');
            toast.innerHTML = message;
            container.appendChild(toast);
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 3500);
        } catch (e) { }
    }

    function init(base) {
        try {
            retryCount = 0;
            var meta = document.querySelector('meta[name="base-url"]');
            baseUrl = base || (meta ? meta.getAttribute('content') : '');
            if (document.getElementById('cardGrid')) {
                bindTabs();
                var activeGroupId = getActiveGroupId();
                loadCards(activeGroupId);
            }
        } catch (e) {
            console.error('ActionBoard.init failed:', e);
            showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    function getActiveGroupId() {
        try {
            return $('#tabContainer .tt-tab.tt-active').data('group-id')
                || $('#tabContainer .tt-tab:first').data('group-id')
                || 0;
        } catch (e) {
            return 0;
        }
    }

    function bindTabs() {
        try {
            $('#tabContainer').on('click', '.tt-tab', function () {
                $('#tabContainer .tt-tab').removeClass('tt-active');
                $(this).addClass('tt-active');
                showSkeletons();
                loadCards($(this).data('group-id'));
            });
        } catch (e) {
        }
    }

    function showSkeletons() {
        try {
            var html = '';
            for (var i = 0; i < 6; i++) {
                html += '<div class="tt-skeleton-card">';
                html += '<div class="tt-skeleton-icon"></div>';
                html += '<div class="tt-skeleton-title"></div>';
                html += '<div class="tt-skeleton-label"></div>';
                html += '<div class="tt-skeleton-row2">';
                html += '<div class="tt-skeleton-count"></div>';
                html += '<div class="tt-skeleton-arrow"></div>';
                html += '</div>';
                html += '</div>';
            }
            $('#cardGrid').html(html);
        } catch (e) {
        }
    }

    function showError(message) {
        try {
            retryCount++;
            var html = '<div class="tt-error-boundary">';
            html += '<div class="tt-error-icon"><i class="fa fa-exclamation-triangle"></i></div>';
            html += '<div class="tt-error-title">Something went wrong</div>';
            html += '<div class="tt-error-msg">' + (message || 'An unexpected error occurred.') + '</div>';
            if (retryCount < maxRetries) {
                html += '<button class="tt-error-retry" onclick="ActionBoard.retry()"><i class="fa fa-refresh"></i> Try Again</button>';
            } else {
                html += '<div style="margin-top:12px;font-size:12px;color:var(--text-secondary);">Please refresh the page to try again.</div>';
            }
            html += '</div>';
            $('#cardGrid').html(html);
        } catch (e) {
        }
    }

    function loadCards(groupId) {
        try {
            showSkeletons();
            $('#cardGrid').off('click', '.card-run-report');
            $.ajax({
                url: baseUrl + 'ActionBoard/GetCards',
                type: 'GET',
                data: { groupId: groupId || 0 },
                dataType: 'json',
                timeout: 30000,
                success: function (res) {
                    try {
                        if (!res || !res.success) {
                            showError((res && res.message) || 'Unable to load pending tasks.');
                            return;
                        }
                        retryCount = 0;
                        var cards = res.data;
                        if (!cards || cards.length === 0) {
                            $('#cardGrid').html('<div class="tt-empty">No pending items</div>');
                            return;
                        }
                        var html = '';
                        var cardColors = ['#10b981','#2563eb','#8b5cf6','#f97316','#7c3aed','#14b8a6'];
                        $.each(cards, function (i, c) {
                            var icon = c && c.Icon ? c.Icon : 'fa-file-text-o';
                            var title = c && c.Title ? c.Title : '';
                            var count = (c && c.Count !== undefined && c.Count !== null) ? c.Count : 0;
                            if (c.ReportId && c.ReportId > 0) {
                                /*                                html += '<div class="tt-card">';*/
                                html += '<div class="tt-card card-run-report" data-config-id="' + c.Id + '" data-report-id="' + c.ReportId + '" data-report-title="' + $('<div>').text(title).html() + '" data-report-icon="' + icon.replace(/'/g, '') + '" data-report-color="' + cardColors[i % 6] + '">';

                            } else {
                                var route = c && c.Route ? c.Route : '#';
                                html += '<div class="tt-card" onclick="window.location.href=\'' + route.replace(/'/g, '') + '\'">';
                            }
                            html += '<div class="tt-card-icon-wrap"><i class="fa ' + icon.replace(/'/g, '') + '"></i></div>';
                            html += '<div class="tt-card-title">' + $('<div>').text(title).html() + '</div>';
                            html += '<div class="tt-card-row2">';
                            html += '<div class="tt-card-count">' + count + '</div>';
                            var amount = (c.Amount !== undefined && c.Amount !== null) ? parseFloat(c.Amount) : 0;
                            if (amount > 0) {
                                html += '<div class="tt-card-amount">';
                                html += '<span class="tt-amount-currency">&#x20B9;</span>';
                                html += '<span class="tt-amount-value">' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>';
                                html += '</div>';
                            }
                            html += '</div>';
                            html += '</div>';
                        });
                        $('#cardGrid').html(html);
                        bindReportArrows();
                    } catch (e) {
                        showError('An error occurred while rendering the dashboard.');
                    }
                },
                error: function (xhr, status) {
                    if (status === 'timeout') {
                        showError('Request timed out. Please try again.');
                    } else {
                        showError('Unable to reach server. Please check your connection.');
                    }
                }
            });
        } catch (e) {
            showError('Failed to load data. Please try again.');
        }
    }

    function bindReportArrows() {
        try {
            $('#cardGrid').on('click', '.card-run-report', function () {
                var $btn = $(this);
                var reportId = $btn.data('report-id');
                var configId = $btn.data('config-id');
                var reportTitle = $btn.data('report-title') || '';
                var reportIcon = $btn.data('report-icon') || 'fa-file-text-o';
                var reportColor = $btn.data('report-color') || 'var(--text-primary)';
                if (!reportId) return;

                $('#reportTitle').css('color', reportColor).html($('<span>').text(reportTitle).html());

                var $icon = $('#reportIcon');
                $icon.html('<i class="fa ' + reportIcon + '"></i>');
                var rgb = hexToRgb(reportColor);
                if (rgb) {
                    $icon.css('background', 'rgba(' + rgb + ',0.1)');
                    $icon.css('border', '1px solid rgba(255,255,255,0.75)');
                    $icon.css('box-shadow', 'inset 0 1px 1px rgba(255,255,255,0.7), 0 4px 12px rgba(' + rgb + ',0.1)');
                    $icon.css('color', reportColor);
                }

                $btn.css('opacity', '0.4').css('cursor', 'wait');
                $btn.off('click');

                $.ajax({
                    url: baseUrl + 'ActionBoard/RunWorkFlowApproval',
                    type: 'GET',
                    data: { configId: configId, reportId: reportId },
                    dataType: 'json',
                    timeout: 120000,
                    success: function (res) {
                        if (res && res.success && res.url) {
                            if (res.isForm === true) {
                                $btn.css('opacity', '1').css('cursor', 'pointer');
                                try {
                                    var winTitle = res.windowTitle || 'Task';
                                    self.parent.OpenWindow(winTitle, reportId, 600, 1000, res.url, 'Images/icons/icon_16_disc.png');
                                } catch (e) {
                                    window.location.href = res.url;
                                }
                                return;
                            }
                            try {
                                var u = new URL(res.url, window.location.href);
                                var sk = u.searchParams.get('SessionKey');
                                if (sk) {
                                    var gridUrl = baseUrl + 'ActionBoardItemInfoTable/Grid?sessionKey=' + encodeURIComponent(sk);
                                    $('.tt-card-grid-wrapper').fadeOut(300);
                                    setTimeout(function () { $('#reportPanel').fadeIn(300); }, 300);
                                    var frame = document.getElementById('panelReportFrame');
                                    if (frame) {
                                        frame.onload = function () {
                                            frame.onload = null;
                                            initFramePagination();
                                        };
                                        frame.src = gridUrl;
                                    }
                                    $btn.css('opacity', '1').css('cursor', 'pointer');
                                    return;
                                }
                            } catch (e) { }
                            window.location.href = res.url;
                        } else {
                            /* OLD: alert(res && res.message ? res.message : 'Failed to generate report.'); */
                            showToast(res && res.message ? res.message : 'Failed to generate report.', 'error');
                            $btn.css('opacity', '1').css('cursor', 'pointer');
                            bindReportArrows();
                        }
                    },
                    error: function (xhr, status) {
                        if (status === 'timeout') {
                            /* OLD: alert('Request timed out. The report may contain too much data.'); */
                            showToast('Request timed out. The report may contain too much data.', 'error');
                        } else {
                            /* OLD: alert('Unable to generate report. Please try again.'); */
                            showToast('Unable to generate report. Please try again.', 'error');
                        }
                        $btn.css('opacity', '1').css('cursor', 'pointer');
                        bindReportArrows();
                    }
                });
            });
        } catch (e) { }
    }

    function retry() {
        try {
            var activeGroupId = getActiveGroupId();
            loadCards(activeGroupId);
        } catch (e) { }
    }

    function applySavedTheme() {
        try {
            var savedTheme = localStorage.getItem('tt-theme');
            var theme = savedTheme === 'light' ? 'light' : 'dark';
            var toggle = document.getElementById('themeToggle');
            if (toggle) {
                toggle.className = 'fa tt-theme-icon ' + (theme === 'dark' ? 'fa-moon-o' : 'fa-sun-o');
            }
        } catch (e) { }
    }

    function toggleTheme() {
        try {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var theme = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            if (theme === 'light') localStorage.setItem('tt-theme', 'light');
            else localStorage.removeItem('tt-theme');
            if (window.parent && window.parent.document) {
                window.parent.document.documentElement.setAttribute('data-theme', theme);
            }
            var panelFrame = document.getElementById('panelReportFrame');
            if (panelFrame && panelFrame.contentWindow && panelFrame.contentWindow.document) {
                panelFrame.contentWindow.document.documentElement.setAttribute('data-theme', theme);
            }
            var icons = document.querySelectorAll('.tt-theme-icon');
            for (var i = 0; i < icons.length; i++) {
                icons[i].className = 'fa tt-theme-icon ' + (theme === 'dark' ? 'fa-moon-o' : 'fa-sun-o');
            }
        } catch (e) { }
    }

    function syncGridTheme() {
        try {
            var savedTheme = localStorage.getItem('tt-theme');
            if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
            else document.documentElement.setAttribute('data-theme', 'dark');
        } catch (e) { }
    }

    function bindThemeToggle() {
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('tt-theme-icon')) {
                toggleTheme();
            }
        });
    }

    function initFramePagination() {
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
    }

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

    function closeReportPanel() {
        try {
            $('#reportPanel').fadeOut(300);
            $('#reportTitle').css('color', '').html('');
            $('#reportIcon').html('').removeAttr('style');
            setTimeout(function () { $('.tt-card-grid-wrapper').fadeIn(300); }, 300);
            var frame = document.getElementById('panelReportFrame');
            if (frame) {
                frame.src = '';
            }
            var container = document.getElementById('ttPagination');
            if (container) {
                container.innerHTML = '';
            }
        } catch (e) { }
    }

    function initGridPagination() {
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
    }

    function addUrlByLinkId(linkId) {
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
    }

    window.AddUrlByLinkId = function (linkId) {
        addUrlByLinkId(linkId);
    };

    function enhanceGridActionButtons() {
        try {
            $('.tt-grid-table td a[onclick]').each(function () {
                var $a = $(this);
                if ($a.attr('onclick').indexOf('AddUrlByLinkId') !== -1) {
                    $a.addClass('tt-grid-action-btn');
                    $a.prepend('<i class="fa fa-plus-circle"></i> ');
                }
            });
        } catch (e) { }
    }

    return {
        init: init,
        retry: retry,
        closeReportPanel: closeReportPanel,
        toggleTheme: toggleTheme,
        applySavedTheme: applySavedTheme,
        bindThemeToggle: bindThemeToggle,
        initGridPagination: initGridPagination,
        addUrlByLinkId: addUrlByLinkId,
        enhanceGridActionButtons: enhanceGridActionButtons
    };
})(jQuery);

$(function () {
    ActionBoard.applySavedTheme();
    if (document.getElementById('themeToggle')) ActionBoard.bindThemeToggle();
    var gridMeta = document.querySelector('meta[name="addurl-endpoint"]');
    if (gridMeta) window._addUrlByLinkIdEndpoint = gridMeta.getAttribute('content');
    if (document.getElementById('cardGrid')) {
        ActionBoard.init();
    }
    if (document.querySelector('.tt-grid-table')) {
        ActionBoard.initGridPagination();
        ActionBoard.enhanceGridActionButtons();
    }
});
