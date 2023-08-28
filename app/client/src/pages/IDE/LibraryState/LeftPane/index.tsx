import React, { useState } from "react";
import styled from "styled-components";
import { Button, Text } from "design-system";
import { useSelector } from "react-redux";
import { selectLibrariesForExplorer } from "selectors/entitiesSelector";
import { LibraryEntity } from "pages/Editor/Explorer/Libraries";
import { AddLibraries } from "./AddLibararies";

const Container = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  p {
    font-size: 30px;
    color: #4c5664;
  }
`;

const PanelSubTitle = styled.div`
  background-color: #fbe6dc;
  flex: 1;
  padding: 4px 8px;
  justify-content: space-between;
  display: flex;
  align-items: center;
`;

export interface LibLeftPaneContent {
  onStateChange: () => void;
}

const LibLeftPane = () => {
  const [addlib, setAddLib] = useState(false);

  if (addlib) {
    return <AddLibraries onStateChange={() => setAddLib(false)} />;
  }
  return <InstalledLibraries onStateChange={() => setAddLib(true)} />;
};

const InstalledLibraries = (props: LibLeftPaneContent) => {
  const libraries = useSelector(selectLibrariesForExplorer);
  return (
    <Container>
      <PanelSubTitle>
        <Text>Installed Libraries</Text>
        <Button
          isIconButton
          kind="tertiary"
          onClick={props.onStateChange}
          startIcon="plus"
        />
      </PanelSubTitle>
      <div className="flex flex-col">
        {libraries.map((lib) => {
          return <LibraryEntity key={lib.name} lib={lib} />;
        })}
      </div>
    </Container>
  );
};

export default LibLeftPane;
