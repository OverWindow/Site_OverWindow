import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import profileImage from "/profile.jpg";
import { fetchMe, loginAdmin, logoutAdmin } from "./api/auth";
import {
  clearAuthData,
  getIsAdmin,
  hasAuthTokens,
  setAuthData,
} from "./api/token";

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [loggedIn, setLoggedIn] = useState(hasAuthTokens());
  const [isAdmin, setIsAdmin] = useState(getIsAdmin());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  console.log("MODE =", import.meta.env.MODE);
  console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
  console.log("ALL_ENV =", import.meta.env);
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
      setLoginError("이메일과 비밀번호를 입력해주세요.");
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

      setLoggedIn(true);
      setIsAdmin(true);
      closeLogin();
    } catch (error) {
      setLoginError(error.message || "로그인 중 오류가 발생했습니다.");
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
      setLoggedIn(false);
      setIsAdmin(false);
      setIsLoginOpen(false);
      setEmail("");
      setPassword("");
      setLoginError("");
    }
  };

  if (isBootstrapping) {
    return null;
  }

  return (
    <div className="app minimal-app">
      <div className="shell">
        <header className="topbar">
          <div className="brand-mark">OverWindow</div>

          <div className="topbar-actions">
            <Link to="/sites" className="top-link">
              Sites
            </Link>
            {isAdmin && <div className="admin-indicator">admin</div>}

            {!loggedIn ? (
              <button
                className="top-link top-link-dark"
                onClick={openLogin}
                type="button"
              >
                Login
              </button>
            ) : (
              <button
                className="profile-button"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            )}
          </div>
        </header>

        <main className="hero">
          <div className="portrait-wrap">
            <img src={profileImage} alt="profile" className="portrait" />
          </div>
          <div className="description-wrap">
            <p className="eyebrow">Developer</p>
            <h1 className="name">김현진</h1>
            <p className="intro">
              복잡한 문제를 가장 빠르게 작동하는 시스템으로 만듭니다.
            </p>
            <div className="line" />
            <p className="bio">
              복잡한 요구사항을 정확히 이해하고, AI와 백엔드 기술로 실제로
              작동하는 시스템을 구현합니다. 빠른 이해와 확실한 결과로 문제를
              해결하는 개발자입니다.
            </p>
          </div>
        </main>
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
