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
          {isAdmin && <div className="admin-indicator">admin</div>}
          <div className="brand-mark">OverWindow</div>

          <div className="topbar-actions">
            <Link to="/sites" className="top-link">
              Sites
            </Link>

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
              AI와 백엔드 시스템을 중심으로 개발하고 있습니다.
            </p>
            <div className="line" />
            <p className="bio">
              AI 시스템과 백엔드 아키텍처에 관심이 있으며, 안정적이고 단순한
              구조의 소프트웨어를 만드는 것을 지향합니다.
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
