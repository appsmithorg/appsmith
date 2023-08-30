import React, { useState } from "react";
import styled from "styled-components";
import { Button } from "design-system";
import { useSelector } from "react-redux";
import { selectLibrariesForExplorer } from "selectors/entitiesSelector";
import { LibraryEntity } from "pages/Editor/Explorer/Libraries";
import { AddLibraries } from "./AddLibararies";
import ListSubTitle from "../../components/ListSubTitle";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  p {
    font-size: 30px;
    color: #4c5664;
  }
  height: calc(100vh - 50px - ${(props) => props.theme.bottomBarHeight});
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
      <ListSubTitle
        rightIcon={
          <Button
            isIconButton
            kind="tertiary"
            onClick={props.onStateChange}
            startIcon="plus"
          />
        }
        title={"Installed Libraries"}
      />
      <div className="flex flex-col flex-auto overflow-auto">
        {libraries.map((lib) => {
          return <LibraryEntity key={lib.name} lib={lib} />;
        })}
      </div>
    </div>
  );
};

export default LibLeftPane;
