import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sling as Hamburger } from "hamburger-react";
// import { push as Hamburger } from "react-burger-menu";

const Menu: React.FC = () => {
  const [isOpen, setOpen] = useState<true | false>(false);
  const handleClose = () => {
    setOpen(false);
  };

  // Animationは、z-indexが効かないので、Animationが終わった後に削除する
  const animatedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = animatedRef.current!;
    if (element) {
      const animatedEnd = () => {
        element.style.opacity = "1";
        element.style.zIndex = "10";
      };
      element.addEventListener("animationend", animatedEnd);
      return () => {
        element.removeEventListener("animationend", animatedEnd);
      };
    }
  }, []);

  return (
    <div>
      <div ref={animatedRef} className="relative hidden md:grid text-xl opacity-0 animate-slideup grid-flow-col justify-stretch items-center text-center">
        <Link className="py-2 mx-0.5 custom-button" to="/">
          Home
        </Link>
        {/* <Link className="py-2 mx-0.5 custom-button" to="/genai/home">GenAI</Link> */}
        <div className="py-2 mx-0.5 custom-button group relative">
          <div>GenAI</div>
          <Link className="link top-11 border-y" to="/genai/genimage">
            GenIMG
          </Link>
          <Link className="link top-22 border-b" to="/genai/gengizi">
            GenGizi
          </Link>
          <Link className="link top-33 border-b" to="/genai/gentext">
            GenText
          </Link>
          <a className="link top-44 border-b" href="https://www.metalmental.net/streamlit/">
            Streamlit
          </a>
          <Link className="link top-55" to="/genai/getkb">
            KB
          </Link>
        </div>
        <div>
          <a className="flex justify-center py-2 mx-0.5 custom-button" href="https://github.com/Flupinochan" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
        <Link className="py-2 mx-0.5 custom-button" to="/profile">
          Profile
        </Link>
      </div>
      {/* <div className="md:hidden opacity-0 animate-slideright relative z-menulist-10 transition-transform duration-300 transform"> */}
      <div className="md:hidden opacity-0 animate-slideright relative z-menulist-10 transition-transform duration-300 transform">
        <div className="flex flex-col items-end">
          <Hamburger toggled={isOpen} toggle={setOpen} />
          {/* <div onClick={handleClose} className={`md:hidden absolute flex flex-col text-center top-10 text-xl transition-transform duration-300 transform ${isOpen ? "animate-slideRight" : "translate-x-trans-x-120"}`}> */}
          <div onClick={handleClose} className={`absolute flex flex-col text-center top-10 text-xl transition-transform duration-300 transform ${isOpen ? "animate-slideRight" : "translate-x-trans-x-120"}`}>
            <Link className="py-2 px-5 mb-1 custom-button" to="/">
              Home
            </Link>
            <div className="p-2 mb-1 custom-button group relative">
              <div>GenAI</div>
              <Link className="link2 top-0" to="/genai/genimage">
                GenIMG
              </Link>
              <Link className="link2 top-12" to="/genai/gengizi">
                GenGizi
              </Link>
              <Link className="link2 top-24" to="/genai/gentext">
                GenText
              </Link>
              <a className="link2 top-36" href="https://www.metalmental.net/streamlit/">
                Streamlit
              </a>
              <Link className="link2 top-48" to="/genai/getkb">
                KB
              </Link>
            </div>
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
