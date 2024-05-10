import React from "react";
import { Link, useLocation } from "react-router-dom";

import "./Home.css";
import { getRum } from "../CloudWatchRUM";

const Home: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    const cwr = getRum();
    if (!cwr) return;
    console.log("logging pageview to cwr: " + location.pathname);
    cwr.recordPageView(location.pathname);
  }, [location]);
  return (
    <div id="home">
      <h2>Archives</h2>
      <ul id="home-list">
        <li>
          <Link to="/blog/vol2">Vol.2 AWS CodeCommitのMonorepo構成</Link>
        </li>
        <li>
          <Link to="/blog/vol1">Vol.1 ブログ初投稿</Link>
        </li>
      </ul>
    </div>
  );
};

export default Home;
