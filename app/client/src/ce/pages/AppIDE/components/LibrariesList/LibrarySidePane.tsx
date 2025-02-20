import React from "react";
import JSLibrariesSection from "pages/AppIDE/components/LibrariesList/JSLibrariesSection";
import { IDESidePaneWrapper } from "IDE";

const LibrarySidePane = (props: { showAddButton: boolean }) => {
  const { showAddButton } = props;

  return (
    <IDESidePaneWrapper>
      <JSLibrariesSection showAddButton={showAddButton} />
    </IDESidePaneWrapper>
  );
};

export default LibrarySidePane;
