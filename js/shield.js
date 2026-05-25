/* YIS Shield – Platzhalter (wird durch npm run build ersetzt) */
(function (g) {
  g.YIS_SHIELD = {
    configured: false,
    cfg: function () {
      return { loginHash: '', apiUrl: null };
    },
    publicApiUrl: function () {
      return '';
    },
    unlock: async function () {
      throw new Error('YIS ist nicht konfiguriert. Siehe SETUP.md im Repository-Root.');
    }
  };
})(typeof window !== 'undefined' ? window : global);
