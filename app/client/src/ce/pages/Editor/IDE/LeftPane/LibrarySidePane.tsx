import React from "react";
import JSLibrariesSection from "pages/Editor/IDE/LeftPane/JSLibrariesSection";
import { IDESidePaneWrapper } from "IDE";

const LibrarySidePane = () => {
  return (
    <IDESidePaneWrapper>
      <JSLibrariesSection />
    </IDESidePaneWrapper>
  );
};

export default LibrarySidePane;
