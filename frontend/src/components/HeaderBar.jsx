import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/HeaderBar.css";

export default function HeaderBar({
  actions,
  homeLabel = "OverWindow",
  homeTo = "/",
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className={`topbar ${isMenuOpen ? "is-open" : ""}`}>
      <div className="topbar-main">
        <Link to={homeTo} className="brand-mark" aria-label="Go to home">
          {homeLabel}
        </Link>

        <button
          className={`hamburger-button ${isMenuOpen ? "is-open" : ""}`}
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={`topbar-actions ${isMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
      >
        {actions}
      </div>
    </header>
  );
}
