import React from "react";
import { Link } from "react-router-dom";

const Title: React.FC = () => {
  return (
    <div className="flex opacity-0 items-center justify-center animate-slidedown pb-2">
      <Link to="/">
        <img src="/images/MetalMental_Blog.png" alt="MetalMental Blog" />
      </Link>
    </div>
  );
};

export default Title;
