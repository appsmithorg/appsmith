import React from "react";
import QueryModuleEntities from "./QueryModuleEntities";
import UIModuleEntities from "./UIModuleEntities";
import JSModuleEntities from "./JSModuleEntities";

const Modules = () => {
  return (
    <>
      <UIModuleEntities />
      <QueryModuleEntities />
      <JSModuleEntities />
    </>
  );
};

export default Modules;
