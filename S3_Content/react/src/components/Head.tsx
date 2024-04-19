import React from "react";
import { Helmet } from "react-helmet";

interface HeadProps {
  themeColor: string;
  description: string;
  title: string;
}

const Head: React.FC<HeadProps> = (props) => {
  return (
    <div>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={props.themeColor} />
        <meta name="description" content={props.description} />
        <link rel="icon" href="/images/favicon.png" />
        <link rel="apple-touch-icon" href="/images/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>{props.title}</title>
      </Helmet>
    </div>
  );
};

export default Head;
