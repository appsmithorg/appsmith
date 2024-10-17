import React from "react";
import JSLibrariesSection from "pages/Editor/IDE/LeftPane/JSLibrariesSection";
import SidePaneWrapper from "pages/common/SidePaneWrapper";

const LibrarySidePane = () => {
  return (
    <SidePaneWrapper>
      <JSLibrariesSection />
    </SidePaneWrapper>
  );
};

export default LibrarySidePane;
