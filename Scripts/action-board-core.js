/* ==========================================
   action-board-core.js
   Flash-of-wrong-theme (FOWT) prevention,
   ActionBoard namespace, and shared utilities
   (hexToRgb, showToast) used by other modules.
   Must be loaded FIRST — before any CSS.
   ========================================== */

/* ==========================================
   FOWT PREVENTION — runs synchronously before
   CSS renders to prevent light-theme flash
   for users who have dark theme saved.
   ========================================== */
(function () {
    try {
        var t = localStorage.getItem('tt-theme');
        document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    } catch (e) { }
})();

/* ==========================================
   NAMESPACE DECLARATION
   Other modules attach their functions here.
   ========================================== */
var ActionBoard = ActionBoard || {};

/* ==========================================
   SHARED UTILITIES
   ========================================== */

/* ------------------------------------------
   hexToRgb(hex) — convert hex color string
   to "r,g,b" format for rgba() usage.
   Accepts 3- or 6-digit hex with '#' prefix.
   Returns null if input is invalid.
   ------------------------------------------ */
ActionBoard.hexToRgb = function hexToRgb(hex) {
    if (!hex || hex.charAt(0) !== '#') return null;
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return r + ',' + g + ',' + b;
};

/* ------------------------------------------
   showToast(message, type) — displays a
   floating notification. Creates the toast
   container on first call if absent.
   Auto-dismisses after 3.5 seconds.
   Types: 'info' (default), 'error',
          'success', 'warning'.
   ------------------------------------------ */
ActionBoard.showToast = function showToast(message, type) {
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
};
