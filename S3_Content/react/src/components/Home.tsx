import React from "react";
import { Link } from "react-router-dom";

import "./Home.css";

const Home: React.FC = () => {
  return (
    <div id="home">
      <h2>Archives</h2>
      <ul id="home-list">
        <li>
          <Link to="/blog/vol1">Vol.1 ブログ初投稿</Link>
        </li>
      </ul>
    </div>
  );
};

export default Home;
