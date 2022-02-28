import React from "react";

if (process.env.NODE_ENV === "development") {
  import("@welldone-software/why-did-you-render").then((module) => {
    const whyDidYouRender = module.default;
    whyDidYouRender(React, {
      trackAllPureComponents: false,
      trackExtraHooks: [[require("react-redux/lib"), "useSelector"]],
    });
  });
}
export default "";
