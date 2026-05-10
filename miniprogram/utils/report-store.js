const STORAGE_KEYS = {
  currentUser: "hazard_current_user",
  currentSection: "hazard_current_section",
  authToken: "hazard_auth_token"
};

const SECTIONS = [
  { code: "TJ01", name: "一标段" },
  { code: "TJ02", name: "二标段" }
];

function getStorage(key, fallbackValue) {
  try {
    const value = wx.getStorageSync(key);
    return value === "" || value === undefined || value === null ? fallbackValue : value;
  } catch (error) {
    return fallbackValue;
  }
}

function setStorage(key, value) {
  wx.setStorageSync(key, value);
}

function getCurrentUser() {
  return getStorage(STORAGE_KEYS.currentUser, null);
}

function setCurrentUser(user) {
  setStorage(STORAGE_KEYS.currentUser, user);
}

function getManageSections() {
  const user = getCurrentUser();
  if (!user) return [];
  const list = user.manageSections;
  return Array.isArray(list) ? list : [];
}

function getCurrentSection() {
  return getStorage(STORAGE_KEYS.currentSection, "");
}

function setCurrentSection(section) {
  setStorage(STORAGE_KEYS.currentSection, section);
}

function clearCurrentSection() {
  wx.removeStorageSync(STORAGE_KEYS.currentSection);
}

function getToken() {
  return getStorage(STORAGE_KEYS.authToken, "");
}

/** 同时存在用户信息与 token 视为已登录 */
function isLoggedIn() {
  const user = getCurrentUser();
  const token = getToken();
  return !!(user && user.name && token);
}

function setToken(token) {
  setStorage(STORAGE_KEYS.authToken, token);
}

function clearSession() {
  wx.removeStorageSync(STORAGE_KEYS.currentUser);
  wx.removeStorageSync(STORAGE_KEYS.currentSection);
  wx.removeStorageSync(STORAGE_KEYS.authToken);
}

module.exports = {
  SECTIONS,
  clearCurrentSection,
  clearSession,
  getCurrentSection,
  getCurrentUser,
  getManageSections,
  getToken,
  isLoggedIn,
  setCurrentSection,
  setCurrentUser,
  setToken
};
