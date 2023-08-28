import React, { useState } from "react";
import styled from "styled-components";
import { Button, Text } from "design-system";
import { useSelector } from "react-redux";
import { selectLibrariesForExplorer } from "selectors/entitiesSelector";
import { LibraryEntity } from "pages/Editor/Explorer/Libraries";
import { AddLibraries } from "./AddLibararies";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  p {
    font-size: 30px;
    color: #4c5664;
  }
  height: calc(100vh - 50px - ${(props) => props.theme.bottomBarHeight});
`;

const PanelSubTitle = styled.div`
  background-color: #fff8f8;
  padding: 4px 12px;
  justify-content: space-between;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #fbe6dc;
`;

export interface LibLeftPaneContent {
  onStateChange: () => void;
}

const LibLeftPane = () => {
  const [addlib, setAddLib] = useState(false);

  return (
    <Container>
      {addlib ? (
        <AddLibraries onStateChange={() => setAddLib(false)} />
      ) : (
        <InstalledLibraries onStateChange={() => setAddLib(true)} />
      )}
    </Container>
  );
};

const InstalledLibraries = (props: LibLeftPaneContent) => {
  const libraries = useSelector(selectLibrariesForExplorer);
  return (
    <div className="flex flex-col h-full">
      <PanelSubTitle>
        <Text kind="heading-xs">Installed Libraries</Text>
        <Button
          isIconButton
          kind="tertiary"
          onClick={props.onStateChange}
          startIcon="plus"
        />
      </PanelSubTitle>
      <div className="flex flex-col flex-auto overflow-auto">
        {libraries.map((lib) => {
          return <LibraryEntity key={lib.name} lib={lib} />;
        })}
      </div>
    </div>
  );
};

export default LibLeftPane;
