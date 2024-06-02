import React from "react";
import { Link } from "react-router-dom";

const GenAiHome: React.FC = () => {
  return (
    <div id="GenAiHome">
      <h2 className="animate-slidelefth2 custom-h2">Generate AI Tool</h2>
      <ul className="animate-slideleft opacity-0 list-none p-1 ">
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <Link className="custom-link" to="/genai/genimage">
            GenIMG
          </Link>
        </li>
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <Link className="custom-link" to="/genai/gengizi">
            GenGizi
          </Link>
        </li>
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <Link className="custom-link" to="/genai/gentext">
            GenText
          </Link>
        </li>
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <a className="custom-link" href="https://www.metalmental.net/streamlit/">
            Streamlit
          </a>
        </li>
        <li className="bg-font-color3 border-l-8 border-font-color1 mb-3 p-2">
          <Link className="custom-link" to="/genai/getkb">
            KB
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default GenAiHome;
