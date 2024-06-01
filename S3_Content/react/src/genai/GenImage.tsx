import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactLoading from "react-loading";
// import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
// import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
// import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import axios, { AxiosResponse } from "axios";

import "./GenImage.css";
import StepsSlider from "./tool/StepsSlider";
import PositivePrompt from "./tool/PositivePrompt";
import CfgScale from "./tool/CfgScale";
import Size from "./tool/Size";
import { getRum } from "../CloudWatchRUM";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4c54c0",
    },
  },
});

const StyledDownloadButton = styled(Button)`
  float: right;
`;

// メイン
const GenImage: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    const cwr = getRum();
    if (!cwr) return;
    console.log("logging pageview to cwr: " + location.pathname);
    cwr.recordPageView(location.pathname);
  }, [location]);
  const [download, setDownload] = useState("");
  const [image, setImage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sizeValueRef = useRef<number>(512);
  const stepsValueRef = useRef<number>(100);
  const cfgScaleValueRef = useRef<number>(10);
  const [spinner, setSpinner] = useState<true | false>(false);

  interface ApiResponse {
    statusCode: number;
    downloadURL: string;
    image: string;
  }

  // const handleSubmit = () => {
  //   setSubmitted(true);
  //   axios
  //     .get(
  //       `https://www.metalmental.net/api/imagegen?positive_prompt=${value}&negative_prompt=none`
  //     )
  //     .then((response: AxiosResponse<ApiResponse>) => {
  //       setDownload(response.data.downloadURL);
  //       setImage(response.data.image);
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // };

  const handleSubmit = (positivePromptValue: string) => {
    setSubmitted(true);
    const postData = {
      positive_prompt: positivePromptValue,
      negative_prompt: "none",
      size: sizeValueRef.current,
      steps: stepsValueRef.current,
      cfg_scale: cfgScaleValueRef.current,
    };
    console.log(postData);
    const postConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const url = "https://www.metalmental.net/api/imagegen";
    setSpinner(true);
    axios
      // .get(
      //   `https://www.metalmental.net/api/imagegen?positive_prompt=${value}&negative_prompt=none`
      // )
      .post(url, postData, postConfig)
      .then((response: AxiosResponse<ApiResponse>) => {
        setDownload(response.data.downloadURL);
        setImage(response.data.image);
        setSpinner(false);
      })
      .catch((error) => {
        setSpinner(false);
        console.log(error);
      });
  };

  const handleSizeChange = (size: number) => {
    sizeValueRef.current = size;
  };

  const handleStepsSliderChange = (steps: number) => {
    stepsValueRef.current = steps;
  };
  const handleCfgScaleChange = (cfgScale: number) => {
    cfgScaleValueRef.current = cfgScale;
  };

  return (
    <div>
      <h2 className="animate-slidelefth2 custom-h2">Generate Image</h2>
      <div className="custom-content-box opacity-0 animate-fadeincontent">
        <div className="wrap">
          <div className="left">
            {spinner && <ReactLoading type={"spin"} color={"#4c54c0"} height={100} width={100} />}
            {submitted && image && <img src={`data:image/png;base64,${image}`} alt="createdImage" />}
            <br />
            {submitted && download && (
              <ThemeProvider theme={theme}>
                <StyledDownloadButton variant="contained">
                  <a id="download_button" href={download}>
                    Download
                  </a>
                </StyledDownloadButton>
              </ThemeProvider>
            )}
          </div>
          <div className="right">
            <ThemeProvider theme={theme}>
              <Size onChange={handleSizeChange} />
              <StepsSlider onChange={handleStepsSliderChange} />
              <CfgScale onChange={handleCfgScaleChange} />
            </ThemeProvider>
          </div>
        </div>
        <PositivePrompt onChange={handleSubmit} buttonDisabled={spinner} />
      </div>
    </div>
  );
};

export default GenImage;
