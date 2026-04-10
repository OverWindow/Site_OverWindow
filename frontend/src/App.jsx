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
        <p className="intro">AI & Backend</p>
        <div className="line" />
        <p className="bio">
          맡겨만 주시면 <b>반드시</b> 완성하는
          <br></br>이 시대의 몇 없는 멋쟁이입니다 :)
        </p>
      </div>
    </main>
  );
}
