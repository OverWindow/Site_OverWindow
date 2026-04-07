import "./App.css";
import profileImage from "/profile.jpg";

export default function App() {
  console.log("MODE =", import.meta.env.MODE);
  console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
  console.log("ALL_ENV =", import.meta.env);

  return (
    <main className="hero">
      <div className="portrait-wrap">
        <img src={profileImage} alt="profile" className="portrait" />
      </div>
      <div className="description-wrap">
        <p className="eyebrow">Developer</p>
        <h1 className="name">김현진</h1>
        <p className="intro">보다 더 먼 곳으로, 플러스 울트라</p>
        <div className="line" />
        <p className="bio">저글링을 잘합니다</p>
      </div>
    </main>
  );
}
