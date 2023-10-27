import React from "react";
import QueryModuleExplorer from "./QueryModuleExplorer";
import UIModuleExplorer from "./UIModuleExplorer";
import JSModuleExplorer from "./JSModuleExplorer";

const Modules = () => {
  return (
    <>
      <UIModuleExplorer />
      <QueryModuleExplorer />
      <JSModuleExplorer />
    </>
  );
};

export default Modules;
