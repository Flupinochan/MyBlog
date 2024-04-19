import React from "react";
import { Helmet } from "react-helmet";

const Head: React.FC = () => {
  return (
    <div>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4c54c0" />
        <meta name="description" content="MetalMental Blog" />
        <link rel="icon" href="/images/favicon.png" />
        <link rel="apple-touch-icon" href="/images/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>MetalMental Blog</title>
      </Helmet>
    </div>
  );
};

export default Head;
