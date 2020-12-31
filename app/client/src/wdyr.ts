import React from "react";

if (false) {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    trackExtraHooks: [[require("react-redux/lib"), "useSelector"]],
  });
}
export default "";
