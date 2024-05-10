import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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

import { AwsRum, AwsRumConfig } from "aws-rum-web";

const config: AwsRumConfig = {
  sessionSampleRate: 1,
  identityPoolId: "us-west-2:a70782e0-77dd-4827-960f-20fd3a84d627",
  endpoint: "https://dataplane.rum.us-west-2.amazonaws.com",
  telemetries: ["performance", "errors", "http"],
  allowCookies: true,
  enableXRay: true,
  // disableAutoPageView: true,
};

const APPLICATION_ID: string = "9bc8a6c1-d424-4bba-a3e4-808a33a1a970";
const APPLICATION_VERSION: string = "1.0.0";
const APPLICATION_REGION: string = "us-west-2";

// https://aws.amazon.com/jp/blogs/mt/using-amazon-cloudwatch-rum-with-a-react-web-application-in-five-steps/
const awsRum: AwsRum = new AwsRum(APPLICATION_ID, APPLICATION_VERSION, APPLICATION_REGION, config);

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
            {/* <Route path="/genai/home" element={<GenAiHome />} /> */}
            <Route path="/genai/genimage" element={<GenImage />} />
            <Route path="/genai/gengizi" element={<GenGizi />} />
            <Route path="/genai/gentext" element={<GenText />} />
            <Route path="/blog/vol1" element={<Blog20240330 />} />
            <Route path="/blog/vol2" element={<Blog20240418 />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </SimpleBar>
      </Router>
    </div>
  );
};

export default App;
