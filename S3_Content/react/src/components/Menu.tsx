import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sling as Hamburger } from "hamburger-react";
// import { push as Hamburger } from "react-burger-menu";

const Menu: React.FC = () => {
  const [isOpen, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <div className="hidden md:grid text-xl opacity-0 animate-slideup grid-flow-col justify-stretch items-center text-center">
        <Link className="py-2 mx-0.5 custom-button" to="/">
          Home
        </Link>
        {/* <Link className="py-2 mx-0.5 custom-button" to="/genai/home">GenAI</Link> */}
        <div className="py-2 mx-0.5 custom-button relative group z-10">
          GenAI
          <ul className="absolute invisible group-hover:visible bg-font-color1">
            <li>
              <Link to="/genai/genimage">GenIMG</Link>
            </li>
            <li>
              <Link to="/genai/gengizi">GenGizi</Link>
            </li>
            <li>
              <Link to="/genai/gentext">GenText</Link>
            </li>
            <li>
              <a href="https://www.metalmental.net/streamlit/">Streamlit</a>
            </li>
            <li>
              <Link to="/genai/getkb">KB</Link>
            </li>
          </ul>
        </div>
        <a className="py-2 mx-0.5 custom-button" href="https://github.com/Flupinochan" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <Link className="py-2 mx-0.5 custom-button" to="/profile">
          Profile
        </Link>
      </div>
      <div className={`md:hidden opacity-0 animate-slideright relative z-10 transition-transform duration-300 transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col items-end">
          <Hamburger toggled={isOpen} toggle={setOpen} />
          <div onClick={handleClose} className={`md:hidden absolute flex flex-col text-center top-10 text-xl transition-transform duration-300 transform ${isOpen ? "animate-slideRight" : "translate-x-trans-x-120"}`}>
            <Link className="p-2 mb-1 custom-button" to="/">
              Home
            </Link>
            <a className="p-2 mb-1 custom-button" href="#xxx">
              GenAI
            </a>
            <a className="p-2 mb-1 custom-button" href="https://github.com/Flupinochan" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link className="p-2 custom-button" to="/profile">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
