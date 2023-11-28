import React from "react";
import AddLibraryPopover from "./AddLibraryPopover";
import PaneHeader from "./PaneHeader";
import { useSelector } from "react-redux";
import { selectLibrariesForExplorer } from "@appsmith/selectors/entitiesSelector";
import { animated, useTransition } from "react-spring";
import { LibraryEntity } from "pages/Editor/Explorer/Libraries";
import styled from "styled-components";

const Container = styled.div`
  width: 250px;
`;

const LibrarySidePane = () => {
  const libraries = useSelector(selectLibrariesForExplorer);
  const transitions = useTransition(libraries, {
    keys: (lib) => lib.name,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 1 },
  });
  return (
    <Container>
      <PaneHeader
        rightIcon={<AddLibraryPopover />}
        title="Installed Libraries"
      />
      {transitions((style, lib) => (
        <animated.div style={style}>
          <LibraryEntity lib={lib} />
        </animated.div>
      ))}
    </Container>
  );
};

export default LibrarySidePane;
