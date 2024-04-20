import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "simplebar-react/dist/simplebar.min.css";
import SimpleBar from "simplebar-react";

import Progressbar from "./components/Progressbar";
import Head from "./components/Head";
import Title from "./components/Title";
import Menu from "./components/Menu";
import Home from "./components/Home";
import "./App.css";
import Blog20240330 from "./blog/2024/03/30/index";
import Blog20240418 from "./blog/2024/04/18/index";

function App() {
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
            <Route path="/blog/vol1" element={<Blog20240330 />} />
            <Route path="/blog/vol2" element={<Blog20240418 />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </SimpleBar>
      </Router>
    </div>
  );
}

export default App;
