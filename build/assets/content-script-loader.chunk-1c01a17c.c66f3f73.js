(function () {
  'use strict';

  (async () => {
    await import(
      /* @vite-ignore */
      chrome.runtime.getURL("assets/chunk-1c01a17c.js")
    );
  })().catch(console.error);

})();
