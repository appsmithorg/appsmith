import React from "react";
console.log("here!!!", process.env);

if (process.env.NODE_ENV === "development") {
  console.log(process.env);
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  //   const ReactRedux = require("react-redux");

  whyDidYouRender(React, {
    trackAllPureComponents: false,
    trackExtraHooks: [[require("react-redux/lib"), "useSelector"]],
  });
}
export default "";
