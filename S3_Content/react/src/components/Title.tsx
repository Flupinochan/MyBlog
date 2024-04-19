import React from "react";
import { Link } from "react-router-dom";

import "./Title.css";

const Title: React.FC = () => {
  return (
    <div id="title">
      <Link to="/">
        <img src="/images/MetalMental_Blog.png" alt="MetalMental Blog" />
      </Link>
    </div>
  );
};

export default Title;
