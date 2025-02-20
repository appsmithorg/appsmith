import React from "react";
import JSLibrariesSection from "pages/AppIDE/components/LibrariesList/JSLibrariesSection";
import { IDESidePaneWrapper } from "IDE";

const LibrarySidePane = () => {
  return (
    <IDESidePaneWrapper>
      <JSLibrariesSection />
    </IDESidePaneWrapper>
  );
};

export default LibrarySidePane;
