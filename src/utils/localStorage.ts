export const getLocalStorage = (key: string, fallback?: any) => {
  try {
    return localStorage[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

export const setLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

export const removeLocalStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

export const isLocalStorageEnabled = () => {
  try {
    const testKey = "__localStorageTest__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};
