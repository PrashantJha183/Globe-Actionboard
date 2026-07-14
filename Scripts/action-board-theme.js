/* ==========================================
   action-board-theme.js
   Dark/light theme management — apply saved
   theme, toggle on click, sync to iframe
   and parent window, and bind the toggle
   button click handler.
   Depends on: action-board-core.js (namespace)
   ========================================== */

(function ($) {
    'use strict';

    /* ------------------------------------------
       applySavedTheme() — reads localStorage
       and sets the theme icon class (moon/sun).
       Called on DOM-ready before anything else.
       ------------------------------------------ */
    ActionBoard.applySavedTheme = function applySavedTheme() {
        try {
            var savedTheme = localStorage.getItem('tt-theme');
            var theme = savedTheme === 'light' ? 'light' : 'dark';
            var toggle = document.getElementById('themeToggle');
            if (toggle) {
                toggle.className = 'fa tt-theme-icon ' + (theme === 'dark' ? 'fa-moon-o' : 'fa-sun-o');
            }
        } catch (e) { }
    };

    /* ------------------------------------------
       toggleTheme() — switches between dark and
       light, saves preference to localStorage,
       and syncs the theme to the parent window
       and the report iframe if they exist.
       ------------------------------------------ */
    ActionBoard.toggleTheme = function toggleTheme() {
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
    };

    /* ------------------------------------------
       syncGridTheme() — reads saved theme from
       localStorage and applies it directly.
       Used in the grid iframe to match the
       parent dashboard's theme.
       ------------------------------------------ */
    ActionBoard.syncGridTheme = function syncGridTheme() {
        try {
            var savedTheme = localStorage.getItem('tt-theme');
            if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
            else document.documentElement.setAttribute('data-theme', 'dark');
        } catch (e) { }
    };

    /* ------------------------------------------
       bindThemeToggle() — listens for clicks
       on any element with .tt-theme-icon class.
       Uses event delegation on document so it
       works even if the toggle is added later.
       ------------------------------------------ */
    ActionBoard.bindThemeToggle = function bindThemeToggle() {
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('tt-theme-icon')) {
                ActionBoard.toggleTheme();
            }
        });
    };

})(jQuery);
