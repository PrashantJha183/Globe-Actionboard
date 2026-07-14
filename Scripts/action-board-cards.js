/* ==========================================
   action-board-cards.js
   Dashboard card grid — tab navigation, card
   rendering with skeleton loading, card click
   handler that opens the report panel, and
   report panel close/back function.
   Depends on: action-board-core.js (namespace,
               hexToRgb, showToast),
               action-board-report.js (initFramePagination)
   ========================================== */

(function ($) {
    'use strict';

    /* ==========================================
       SHARED MODULE STATE
       Encapsulated in this IIFE — not exposed
       on the ActionBoard namespace.
       ========================================== */
    var baseUrl = '';
    var retryCount = 0;
    var maxRetries = 3;
    var tabTimer = null;

    /* ==========================================
       CARD GRID INITIALISATION
       ========================================== */

    /* ------------------------------------------
       getActiveGroupId() — reads the currently
       active tab's data-group-id, falling back
       to the first tab, then 0.
       ------------------------------------------ */
    function getActiveGroupId() {
        try {
            return $('#tabContainer .tt-tab.tt-active').data('group-id')
                || $('#tabContainer .tt-tab:first').data('group-id')
                || 0;
        } catch (e) {
            return 0;
        }
    }

    /* ------------------------------------------
       bindTabs() — delegates click on #tabContainer
       .tt-tab elements. Debounced at 200ms to
       prevent out-of-order AJAX. If the report
       panel is open, closes it first.
       ------------------------------------------ */
    function bindTabs() {
        try {
            $('#tabContainer').on('click', '.tt-tab', function () {
                clearTimeout(tabTimer);
                var $tab = $(this);
                tabTimer = setTimeout(function () {
                    $('#tabContainer .tt-tab').removeClass('tt-active');
                    $tab.addClass('tt-active');

                    if ($('#reportPanel').is(':visible')) {
                        $('#reportPanel').hide();
                        var frame = document.getElementById('panelReportFrame');
                        if (frame) { frame.src = ''; frame.classList.remove('tt-frame-loaded'); }
                        var skel = document.getElementById('reportTableSkeleton');
                        if (skel) skel.style.display = 'none';
                        var pg = document.getElementById('ttPagination');
                        if (pg) pg.innerHTML = '';
                        $('.tt-card-grid-wrapper').show();
                    }

                    loadCards($tab.data('group-id'));
                }, 200);
            });
        } catch (e) {
        }
    }

    /* ==========================================
       CARD RENDERING — skeleton, cards, error
       ========================================== */

    /* ------------------------------------------
       showSkeletons() — replaces #cardGrid
       content with 4 placeholder skeleton cards
       shown while the AJAX request is in flight.
       ------------------------------------------ */
    function showSkeletons() {
        try {
            var html = '';
            for (var i = 0; i < 4; i++) {
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

    /* ------------------------------------------
       showError(message) — displays an error
       boundary with retry button. Tracks retry
       count; after maxRetries, shows a "refresh"
       message instead of the retry button.
       ------------------------------------------ */
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

    /* ------------------------------------------
       loadCards(groupId, showSkeleton) — fetches
       cards from ActionBoard/GetCards via AJAX.
       Shows skeletons first, then renders cards
       with entrance animation. Binds card-click
       handler after render.
       ------------------------------------------ */
    function loadCards(groupId, showSkeleton) {
        try {
            if (showSkeleton !== false) showSkeletons();
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
                        var $skels = $('#cardGrid .tt-skeleton-card');
                        if ($skels.length > 0) {
                            $skels.addClass('tt-exit');
                            setTimeout(function () {
                                $('#cardGrid').html(html);
                                $('#cardGrid .tt-card').each(function (i) {
                                    $(this).css('animation-delay', (i * 0.06) + 's');
                                });
                                bindReportArrows();
                            }, 300);
                        } else {
                            $('#cardGrid').html(html);
                            $('#cardGrid .tt-card').each(function (i) {
                                $(this).css('animation-delay', (i * 0.06) + 's');
                            });
                            bindReportArrows();
                        }
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

    /* ==========================================
       CARD CLICK HANDLER — opens report panel
       ========================================== */

    /* ------------------------------------------
       bindReportArrows() — delegates click on
       #cardGrid .card-run-report. Fetches the
       report URL from the server, then either
       opens a popup (isForm) or loads the grid
       into the inline report panel iframe.
       Includes double-click guard via .data().
       ------------------------------------------ */
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
                var rgb = ActionBoard.hexToRgb(reportColor);
                if (rgb) {
                    $icon.css('background', 'rgba(' + rgb + ',0.1)');
                    $icon.css('border', '1px solid rgba(255,255,255,0.75)');
                    $icon.css('box-shadow', 'inset 0 1px 1px rgba(255,255,255,0.7), 0 4px 12px rgba(' + rgb + ',0.1)');
                    $icon.css('color', reportColor);
                }

                $btn.css('opacity', '0.4').css('cursor', 'wait');
                $btn.off('click');
                if ($btn.data('loading')) return;
                $btn.data('loading', true);

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
                                $btn.removeData('loading');
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
                                    var skeleton = document.getElementById('reportTableSkeleton');
                                    var frame = document.getElementById('panelReportFrame');
                                    if (frame) {
                                        frame.classList.remove('tt-frame-loaded');
                                        frame.style.opacity = '';
                                    }
                                    $('.tt-card-grid-wrapper').fadeOut(300);
                                    setTimeout(function () {
                                        $('#reportPanel').fadeIn(300);
                                        if (skeleton) {
                                            skeleton.style.display = 'block';
                                            skeleton.className = 'tt-table-skeleton tt-table-skeleton-enter';
                                            setTimeout(function () { skeleton.className = 'tt-table-skeleton'; }, 300);
                                        }
                                    }, 300);
                                    if (frame) {
                                        frame.onload = function () {
                                            frame.onload = null;
                                            if (skeleton) {
                                                skeleton.className = 'tt-table-skeleton tt-table-skeleton-exit';
                                                setTimeout(function () {
                                                    skeleton.style.display = 'none';
                                                    frame.classList.add('tt-frame-loaded');
                                                }, 300);
                                            } else {
                                                frame.classList.add('tt-frame-loaded');
                                            }
                                            ActionBoard.initFramePagination();
                                        };
                                        frame.src = gridUrl;
                                    }
                                    $btn.css('opacity', '1').css('cursor', 'pointer');
                                    $btn.removeData('loading');
                                    return;
                                }
                            } catch (e) { }
                            window.location.href = res.url;
                        } else {
                            ActionBoard.showToast(res && res.message ? res.message : 'Failed to generate report.', 'error');
                            $btn.css('opacity', '1').css('cursor', 'pointer');
                            $btn.removeData('loading');
                        }
                    },
                    error: function (xhr, status) {
                        if (status === 'timeout') {
                            ActionBoard.showToast('Request timed out. The report may contain too much data.', 'error');
                        } else {
                            ActionBoard.showToast('Unable to generate report. Please try again.', 'error');
                        }
                        $btn.css('opacity', '1').css('cursor', 'pointer');
                        $btn.removeData('loading');
                    }
                });
            });
        } catch (e) { }
    }

    /* ==========================================
       RETRY — called from error boundary button
       ========================================== */

    /* ------------------------------------------
       retry() — reloads the currently active
       tab's cards. Bound to the error state
       "Try Again" button via onclick.
       ------------------------------------------ */
    ActionBoard.retry = function retry() {
        try {
            var activeGroupId = getActiveGroupId();
            loadCards(activeGroupId);
        } catch (e) { }
    };

    /* ==========================================
       INIT — entry point called on DOM-ready
       ========================================== */

    /* ------------------------------------------
       init(base) — reads the base URL from
       <meta name="base-url"> reads active tab,
       binds tab clicks, and loads initial cards.
       Called from the DOM-ready bootstrap.
       ------------------------------------------ */
    ActionBoard.init = function init(base) {
        try {
            clearTimeout(tabTimer);
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
    };

    /* ==========================================
       CLOSE REPORT PANEL — called from Back button
       ========================================== */

    /* ------------------------------------------
       closeReportPanel() — fades out the report
       panel, resets the iframe, hides the table
       skeleton, clears pagination, and fades
       the card grid back in.
       Bound to the Back button via onclick.
       ------------------------------------------ */
    ActionBoard.closeReportPanel = function closeReportPanel() {
        try {
            clearTimeout(tabTimer);
            $('#reportPanel').fadeOut(300);
            $('#reportTitle').css('color', '').html('');
            $('#reportIcon').html('').removeAttr('style');
            setTimeout(function () { $('.tt-card-grid-wrapper').fadeIn(300); }, 300);
            var frame = document.getElementById('panelReportFrame');
            if (frame) {
                frame.src = '';
                frame.onload = null;
                frame.classList.remove('tt-frame-loaded');
            }
            var skel = document.getElementById('reportTableSkeleton');
            if (skel) skel.style.display = 'none';
            var container = document.getElementById('ttPagination');
            if (container) {
                container.innerHTML = '';
            }
        } catch (e) { }
    };

})(jQuery);
