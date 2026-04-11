import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  fetchMe,
  loginAdmin,
  logoutAdmin,
  refreshAuthToken,
} from "../api/auth";
import {
  clearAuthData,
  getAccessToken,
  getIsAdmin,
  hasAuthTokens,
  setAuthData,
} from "../api/token";
import HeaderBar from "./HeaderBar";

function getTokenExpirationMs(token) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));
    return decoded?.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function formatRemainingTime(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function AppLayout() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(hasAuthTokens());
  const [isAdmin, setIsAdmin] = useState(getIsAdmin());
  const [sessionRemainingMs, setSessionRemainingMs] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      if (!hasAuthTokens()) {
        setLoggedIn(false);
        setIsAdmin(false);
        setIsBootstrapping(false);
        return;
      }

      try {
        const me = await fetchMe();
        setLoggedIn(true);
        setIsAdmin(!!me?.is_admin);
      } catch {
        clearAuthData();
        setLoggedIn(false);
        setIsAdmin(false);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrapAuth();
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setSessionRemainingMs(null);
      return undefined;
    }

    const token = getAccessToken();
    const expirationMs = getTokenExpirationMs(token);

    if (!expirationMs) {
      setSessionRemainingMs(null);
      return undefined;
    }

    const updateRemaining = () => {
      const remaining = expirationMs - Date.now();

      if (remaining <= 0) {
        clearAuthData();
        window.location.reload();
        return;
      }

      setSessionRemainingMs(remaining);
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);

    return () => window.clearInterval(intervalId);
  }, [loggedIn]);

  const openLogin = () => {
    setLoginError("");
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    setIsLoginOpen(false);
    setLoginError("");
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLoginError("이메일/비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginError("");

      const data = await loginAdmin({
        email: email.trim(),
        password,
      });

      setAuthData({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        is_admin: true,
      });

      window.location.reload();
    } catch (error) {
      setLoginError(error.message || "로그인 과정 중 에러가 발생하였습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      console.error("logout failed:", error);
    } finally {
      clearAuthData();
      window.location.reload();
    }
  };

  const handleRefreshSession = async () => {
    try {
      setIsRefreshingSession(true);
      const data = await refreshAuthToken();

      setAuthData({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        is_admin: true,
      });

      const nextExpirationMs = getTokenExpirationMs(data.access_token);
      if (nextExpirationMs) {
        setSessionRemainingMs(Math.max(0, nextExpirationMs - Date.now()));
      }
    } catch (error) {
      console.error("refresh failed:", error);
      clearAuthData();
      window.location.reload();
    } finally {
      setIsRefreshingSession(false);
    }
  };

  if (isBootstrapping) {
    return null;
  }

  return (
    <div className="app minimal-app">
      <div className="shell">
        <HeaderBar
          actions={
            <>
              <Link to="/" className="top-link">
                Home
              </Link>
              <Link to="/sites" className="top-link">
                Sites
              </Link>
              {loggedIn ? (
                <Link to="/recommendations" className="top-link">
                  AI Picks
                </Link>
              ) : (
                <button
                  className="top-link top-link-disabled"
                  onClick={openLogin}
                  type="button"
                >
                  AI Picks
                </button>
              )}
              {loggedIn ? (
                <Link to="/settings" className="top-link">
                  Settings
                </Link>
              ) : (
                <button
                  className="top-link top-link-disabled"
                  onClick={openLogin}
                  type="button"
                >
                  Settings
                </button>
              )}
              {!loggedIn && (
                <button
                  className="top-link top-link-dark"
                  onClick={openLogin}
                  type="button"
                >
                  Login
                </button>
              )}
              {loggedIn && (
                <button
                  className="top-link top-link-dark"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              )}
              {loggedIn && sessionRemainingMs != null && (
                <div className="session-tools">
                  <div
                    className="session-timer"
                    title="로그인 유효 시간"
                    aria-label={`로그인 유효 시간 ${formatRemainingTime(sessionRemainingMs)}`}
                  >
                    {formatRemainingTime(sessionRemainingMs)}
                  </div>
                  <button
                    className="session-refresh"
                    type="button"
                    onClick={handleRefreshSession}
                    disabled={isRefreshingSession}
                    title="세션 시간 연장"
                    aria-label="세션 시간 연장"
                  >
                    {isRefreshingSession ? "..." : "↻"}
                  </button>
                </div>
              )}
              {isAdmin && <div className="admin-indicator">admin</div>}
            </>
          }
        />

        <Outlet />
      </div>

      {isLoginOpen && (
        <div className="login-overlay" onClick={closeLogin}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <form className="login-form" onSubmit={handleLogin}>
              <p className="login-label">Admin Access</p>
              <h2 className="login-title">Login</h2>
              <p className="login-subtext">
                로그인 후 Sites, AI Picks, Settings를 사용할 수 있습니다.
                브라우저가 저장 여부를 물으면 비밀번호를 저장할 수 있어요.
              </p>

              <input
                type="email"
                placeholder="Email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={isSubmitting}
              />

              <input
                type="password"
                placeholder="Password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
              />

              {loginError && <p className="login-error">{loginError}</p>}

              <button
                className="login-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Loading..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
