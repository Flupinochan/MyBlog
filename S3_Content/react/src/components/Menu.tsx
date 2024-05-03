import React from "react";
import { Link } from "react-router-dom";

import "./Menu.css";

const Menu: React.FC = () => {
  return (
    <div id="menu">
      <div id="drop-menu">
        <Link to="/">Home</Link>
      </div>
      <div id="drop-menu">
        {/* <Link to="/genai/home">GenAI</Link> */}
        GenAI
        <ul>
          <li>
            <Link to="/genai/genimage">GenIMG</Link>
          </li>
          <li>
            <Link to="/genai/gengizi">GenGizi</Link>
          </li>
          <li>
            <Link to="/genai/gentext">GenText</Link>
          </li>
        </ul>
      </div>
      <div id="drop-menu">
        <a
          href="https://github.com/Flupinochan"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
      <div id="drop-menu">
        <a href="#Profile">Profile</a>
      </div>
    </div>
  );
};

export default Menu;
