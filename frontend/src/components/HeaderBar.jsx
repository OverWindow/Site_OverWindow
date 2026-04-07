import { Link } from "react-router-dom";
import "../styles/HeaderBar.css";

export default function HeaderBar({
  actions,
  homeLabel = "OverWindow",
  homeTo = "/",
}) {
  return (
    <header className="topbar">
      <Link to={homeTo} className="brand-mark">
        {homeLabel}
      </Link>

      <div className="topbar-actions">{actions}</div>
    </header>
  );
}
