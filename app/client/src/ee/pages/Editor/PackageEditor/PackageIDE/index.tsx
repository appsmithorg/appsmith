import React from "react";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import { tailwindLayers } from "constants/Layers";
import BottomBar from "../BottomBar";
import LeftPane from "./LeftPane";
import Sidebar from "./Sidebar";
import MainPane from "./MainPane";

function PackageIDE() {
  return (
    <>
      <EditorWrapperContainer>
        <div
          className={`transition-transform transform duration-400 flex relative ${tailwindLayers.entityExplorer}`}
        >
          <Sidebar />
          <LeftPane />
        </div>
        <MainPane id="app-body" />
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
}

PackageIDE.displayName = "AppsmithPackageIDE";

export default PackageIDE;
