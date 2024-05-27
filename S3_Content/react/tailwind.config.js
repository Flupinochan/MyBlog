/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "font-color1": "#4c54c0",
        "font-color2": "#e5deff",
        "font-color3": "#e1e4f5",
        "link-color": "#1e90ff",
        "bg-color1": "#f3f9f9",
        "bg-color2": "#eef7f7",
        "line-color": "#4C54C0",
        "day-color": "#979797",
      },
      borderWidth: {
        1: "1px",
        3: "3px",
      },
      translate: {
        "trans-x-120": "120%",
      },
      transitionProperty: {
        width: "width",
      },
      transitionDuration: {
        400: "400ms",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slidedown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideright: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideleft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadein: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        slidedown: "slidedown 0.5s cubic-bezier(0, 0, 0.01, 1) 0.5s forwards",
        slideup: "slideUp 0.5s cubic-bezier(0, 0, 0.01, 1) 0.8s forwards",
        slideright: "slideright 0.5s cubic-bezier(0, 0, 0.01, 1) 0.8s forwards",
        slidelefth2: "slideleft 0.3s cubic-bezier(0, 0, 0.2, 1) 1.2s forwards",
        slideleft: "slideleft 0.3s cubic-bezier(0, 0, 0.2, 1) 1.3s forwards",
        fadeincontent: "fadein 0.6s 1.4s forwards",
      },
    },
    fontFamily: {
      notosans: ["Noto Sans JP", "Meiryo", "sans-serif"],
    },
  },
  variants: {
    visibility: ["responsive", "hover", "focus", "group-hover"],
  },
  plugins: [],
};
