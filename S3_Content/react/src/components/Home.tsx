import React from "react";
import { Link, useLocation } from "react-router-dom";

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
    <div className="z-0">
      <h2 className="animate-slidelefth2 custom-h2 custom-h2-boxshadow">Archives</h2>
      <ul className="animate-slideleft opacity-0 list-none p-1">
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <Link className="custom-link" to="/blog/vol3">
            Vol.3 AWS CloudWatch RUMによるユーザ視点からの監視
          </Link>
        </li>
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <Link className="custom-link" to="/blog/vol2">
            Vol.2 AWS CodeCommitのMonorepo構成
          </Link>
        </li>
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <Link className="custom-link" to="/blog/vol1">
            Vol.1 ブログ初投稿
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Home;
