import React from "react";
import AddLibraryPopover from "./AddLibraryPopover";
import PaneHeader from "./PaneHeader";
import { useSelector } from "react-redux";
import { selectLibrariesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { animated, useTransition } from "react-spring";
import { LibraryEntity } from "pages/Editor/Explorer/Libraries";

const LibrarySidePane = () => {
  const libraries = useSelector(selectLibrariesForExplorer);
  const transitions = useTransition(libraries, {
    keys: (lib) => lib.name,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 1 },
  });
  return (
    <div>
      <PaneHeader
        rightIcon={<AddLibraryPopover />}
        title="Installed Libraries"
      />
      {transitions((style, lib) => (
        <animated.div style={style}>
          <LibraryEntity lib={lib} />
        </animated.div>
      ))}
    </div>
  );
};

export default LibrarySidePane;
