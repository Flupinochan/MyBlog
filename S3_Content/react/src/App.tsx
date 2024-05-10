import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "simplebar-react/dist/simplebar.min.css";
import SimpleBar from "simplebar-react";

import "./App.css";
import Progressbar from "./components/Progressbar";
import Head from "./components/Head";
import Title from "./components/Title";
import Menu from "./components/Menu";
import Home from "./components/Home";
// import GenAiHome from "./genai/GenAiHome";
import GenImage from "./genai/GenImage";
import GenGizi from "./genai/GenGizi";
import GenText from "./genai/GenText";
import Blog20240330 from "./blog/2024/03/30/index";
import Blog20240418 from "./blog/2024/04/18/index";
import Blog20240510 from "./blog/2024/05/10/index";

const App: React.FC = () => {
  return (
    <div className="App">
      <Router>
        <Progressbar />
        <Head />
        <Title />
        <Menu />
        <SimpleBar style={{ maxHeight: "84vh" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/genai/genimage" element={<GenImage />} />
            <Route path="/genai/gengizi" element={<GenGizi />} />
            <Route path="/genai/gentext" element={<GenText />} />
            <Route path="/blog/vol1" element={<Blog20240330 />} />
            <Route path="/blog/vol2" element={<Blog20240418 />} />
            <Route path="/blog/vol3" element={<Blog20240510 />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </SimpleBar>
      </Router>
    </div>
  );
};

export default App;
