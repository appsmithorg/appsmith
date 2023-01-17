import React from "react";
import { NavigationProps } from "./constants";
import TopStacked from "./TopStacked";

const Navigation = (props: NavigationProps) => {
  const navComponent = <TopStacked {...props} />;

  return navComponent;
};

export default Navigation;
