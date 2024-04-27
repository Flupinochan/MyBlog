import React from "react";
import { Link } from "react-router-dom";

const GenAiHome: React.FC = () => {
  return (
    <div id="GenAiHome">
      <h2>Generate AI Tool</h2>
      <ul id="home-list">
        <li>
          <Link to="/genai/genimage">GenIMG</Link>
        </li>
      </ul>
    </div>
  );
};

export default GenAiHome;
