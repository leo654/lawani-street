(function () {
  "use strict";

  /**
   * Lawani St. Safe Storage
   * ========================================
   * Provides safe localStorage access with fallback to in-memory storage.
   * Handles private browsing mode, quota exceeded errors, and other localStorage failures.
   */

  var memoryStorage = {};
  var useMemory = false;

  function testLocalStorage() {
    try {
      var testKey = "__lawani_storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn("localStorage is unavailable; using in-memory fallback.", error);
      return false;
    }
  }

  useMemory = !testLocalStorage();

  function safeSetItem(key, value) {
    try {
      if (useMemory) {
        memoryStorage[key] = String(value);
        return true;
      }
      localStorage.setItem(key, String(value));
      return true;
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded; falling back to memory storage.", error);
        useMemory = true;
        memoryStorage[key] = String(value);
        return true;
      }
      console.warn("Unable to set storage item:", error);
      return false;
    }
  }

  function safeGetItem(key) {
    try {
      if (useMemory) {
        return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("Unable to get storage item:", error);
      return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
    }
  }

  function safeRemoveItem(key) {
    try {
      if (useMemory) {
        delete memoryStorage[key];
        return true;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn("Unable to remove storage item:", error);
      delete memoryStorage[key];
      return false;
    }
  }

  function safeClear() {
    try {
      if (useMemory) {
        memoryStorage = {};
        return true;
      }
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn("Unable to clear storage:", error);
      memoryStorage = {};
      return false;
    }
  }

  function safeHasKey(key) {
    try {
      if (useMemory) {
        return memoryStorage.hasOwnProperty(key);
      }
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.warn("Unable to check storage key:", error);
      return memoryStorage.hasOwnProperty(key);
    }
  }

  window.LawaniStorage = {
    setItem: safeSetItem,
    getItem: safeGetItem,
    removeItem: safeRemoveItem,
    clear: safeClear,
    hasKey: safeHasKey,
    isMemoryFallback: function () { return useMemory; }
  };
})();
