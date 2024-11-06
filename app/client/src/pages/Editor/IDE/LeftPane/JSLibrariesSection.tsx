import React, { useMemo } from "react";

import PaneHeader from "pages/Editor/IDE/LeftPane/PaneHeader";
import AddLibraryPopover from "pages/Editor/IDE/LeftPane/AddLibraryPopover";
import { selectLibrariesForExplorer } from "ee/selectors/entitiesSelector";
import { useSelector } from "react-redux";
import { animated, useTransition } from "react-spring";
import { LibraryEntity } from "pages/Editor/Explorer/Libraries";

function JSLibrariesSection() {
  const libraries = useSelector(selectLibrariesForExplorer);
  const transitions = useTransition(libraries, {
    keys: (lib) => lib.name,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 1 },
  });

  const rightIcon = useMemo(() => <AddLibraryPopover />, []);

  return (
    <>
      <PaneHeader rightIcon={rightIcon} title="Installed Libraries" />
      {transitions((style, lib) => (
        <animated.div style={style}>
          <LibraryEntity lib={lib} />
        </animated.div>
      ))}
    </>
  );
}

export default JSLibrariesSection;
