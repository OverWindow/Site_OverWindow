import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { fetchMe, loginAdmin, logoutAdmin } from "../api/auth";
import {
  clearAuthData,
  getIsAdmin,
  hasAuthTokens,
  setAuthData,
} from "../api/token";
import HeaderBar from "./HeaderBar";

export default function AppLayout() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(hasAuthTokens());
  const [isAdmin, setIsAdmin] = useState(getIsAdmin());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
              <input
                type="email"
                placeholder="Email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />

              <input
                type="password"
                placeholder="Password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
