import { useEffect, useState } from "react";
import { fetchMe, updateMe } from "../api/auth";
import "../styles/Settings.css";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [username, setUsername] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    async function loadMe() {
      try {
        setIsLoading(true);
        setPageError("");
        const me = await fetchMe();
        setUsername(me?.username || "");
      } catch (error) {
        setPageError(error.message || "설정 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMe();
  }, []);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setUsernameMessage("Username is required.");
      return;
    }

    try {
      setIsSavingUsername(true);
      setUsernameMessage("");
      await updateMe({
        username: username.trim(),
        email: null,
        password: null,
      });
      setUsernameMessage("Username updated.");
    } catch (error) {
      setUsernameMessage(error.message || "Username update failed.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!password || !passwordConfirm) {
      setPasswordMessage("Enter the new password twice.");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordMessage("");
      await updateMe({
        username,
        email: null,
        password,
      });
      setPassword("");
      setPasswordConfirm("");
      setPasswordMessage("Password updated.");
    } catch (error) {
      setPasswordMessage(error.message || "Password update failed.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <main className="settings-page">
      <section className="settings-shell">
        <header className="settings-header">
          <p className="settings-kicker">Account</p>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Update your username and password while keeping the same calm,
            minimal workflow.
          </p>
        </header>

        {isLoading && <p className="settings-info">Loading...</p>}
        {!isLoading && pageError && <p className="settings-error">{pageError}</p>}

        {!isLoading && !pageError && (
          <div className="settings-grid">
            <section className="settings-card">
              <div className="settings-card-head">
                <p className="settings-label">Profile</p>
                <h2>Change username</h2>
              </div>

              <form className="settings-form" onSubmit={handleUsernameSubmit}>
                <label className="settings-field">
                  <span>Username</span>
                  <input
                    className="settings-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSavingUsername}
                  />
                </label>

                {usernameMessage && (
                  <p className="settings-message">{usernameMessage}</p>
                )}

                <button
                  className="settings-submit"
                  type="submit"
                  disabled={isSavingUsername}
                >
                  {isSavingUsername ? "Saving..." : "Save username"}
                </button>
              </form>
            </section>

            <section className="settings-card">
              <div className="settings-card-head">
                <p className="settings-label">Security</p>
                <h2>Change password</h2>
              </div>

              <form className="settings-form" onSubmit={handlePasswordSubmit}>
                <label className="settings-field">
                  <span>New password</span>
                  <input
                    className="settings-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSavingPassword}
                  />
                </label>

                <label className="settings-field">
                  <span>Confirm password</span>
                  <input
                    className="settings-input"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    disabled={isSavingPassword}
                  />
                </label>

                {passwordMessage && (
                  <p className="settings-message">{passwordMessage}</p>
                )}

                <button
                  className="settings-submit"
                  type="submit"
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? "Saving..." : "Save password"}
                </button>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
