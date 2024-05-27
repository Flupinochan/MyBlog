import React from "react";

const Profile: React.FC = () => {
  return (
    <div className="container mt-16 flex justify-between items-center mx-auto px-8 md:px-14 lg:px-24 w-full">
      <div className="flex flex-wrap md:flex-nowrap">
        <div className="md:my-36 lg:ml-20 justify-center md:justify-start mx-auto max-w-xl flex flex-wrap">
          <h1 className="font-bold text-5xl text-center md:text-left lg:text-7xl md:text-6xl">
            TailwindCSSで
            <br />
            美しいサイトを
            <br />
            作ります
          </h1>
          <button className="px-6 py-2 mt-10 text-font-color2 bg-font-color1 font-bold rounded-lg hover:bg-font-color2 hover:text-font-color1 transition-all duration-300">
            <i className="fa-solid fa-rocket mr-2"></i>
            <span>もっと見る</span>
          </button>
        </div>
        <img src="/images/big_image.png" alt="profileImage" className="md:absolute lg:top-2 lg:right-52 md:w-3/5 w-10/12 mt-12 md:mt-0 right-6 mx-auto lg:w-3/6 -z-10" />
      </div>
    </div>
  );
};

export default Profile;
