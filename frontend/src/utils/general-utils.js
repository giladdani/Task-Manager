const handleLogin = () => {
    window.location = "/schedules";
  }

const handleLogout = () => {
    sessionStorage.clear();
    window.location = "/";
}

module.exports = {
    handleLogin: handleLogin,
    handleLogout: handleLogout,
}