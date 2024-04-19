import React from "react";
import { Link } from "react-router-dom";

import "./Menu.css";

const Menu: React.FC = () => {
  return (
    <div id="menu">
      <Link to="/">
        <img src="/images/home.png" alt="homeIcon" />
        Home
      </Link>
      <a href="#GenAI">
        <img src="/images/GenAI.png" alt="GenAIIcon" />
        GenAI
      </a>
      <a
        href="https://github.com/Flupinochan"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/images/GitHub.png" alt="GitHubIcon" />
        GitHub
      </a>
      <a href="#Profile">
        <img src="/images/Profile.png" alt="ProfileIcon" />
        Profile
      </a>
    </div>
  );
};

export default Menu;
