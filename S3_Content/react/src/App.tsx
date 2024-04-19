import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Head from "./components/Head";
import Title from "./components/Title";
import Menu from "./components/Menu";
import Home from "./components/Home";
import Blog20240330 from "./blog/2024/03/30";

const headProps = {
  themeColor: "#4c54c0",
  description: "MetalMental Blog",
  title: "MetalMental Blog",
};

function App() {
  return (
    <div className="App">
      <Router>
        <Head
          themeColor={headProps.themeColor}
          description={headProps.description}
          title={headProps.title}
        />
        <Title />
        <Menu />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/src/blog/2024/03/30/index.tsx"
            element={<Blog20240330 />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
