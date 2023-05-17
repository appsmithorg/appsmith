import * as React from "react";
export default "SvgrURL";

function MockedSvgReactComponent(props) {
  return React.createElement("svg", props);
}

MockedSvgReactComponent.displayName = "MockedSvgReactComponent";

export const ReactComponent = MockedSvgReactComponent;
