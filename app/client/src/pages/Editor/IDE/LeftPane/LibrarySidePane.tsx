import React from "react";
import AddLibraryPopover from "./AddLibraryPopover";
import PaneHeader from "./PaneHeader";
import { useSelector } from "react-redux";
import { selectLibrariesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { List } from "design-system";

const LibrarySidePane = () => {
  const libraries = useSelector(selectLibrariesForExplorer);
  const onClick = () => {};
  return (
    <div>
      <PaneHeader
        rightIcon={<AddLibraryPopover />}
        title="Installed Libraries"
      />
      <List
        items={libraries.map((lib) => ({
          title: lib.name,
          description: lib.version || "",
          onClick,
          descriptionType: "inline",
        }))}
      />
    </div>
  );
};

export default LibrarySidePane;
