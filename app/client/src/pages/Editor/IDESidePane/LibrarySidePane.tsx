import React from "react";
import AddLibraryPopover from "./AddLibraryPopover";
import PaneHeader from "./PaneHeader";

const LibrarySidePane = () => {
  return (
    <div>
      <PaneHeader
        rightIcon={<AddLibraryPopover />}
        title="Installed Libraries"
      />
    </div>
  );
};

export default LibrarySidePane;
