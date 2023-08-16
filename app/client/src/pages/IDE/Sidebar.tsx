import React from "react";
import styled from "styled-components";
import { importSvg } from "design-system-old";

const DataIcon = importSvg(
  () => import("assets/icons/header/IA-POC/database-2-line.svg"),
);

const PagesIcon = importSvg(
  () => import("assets/icons/header/IA-POC/file-copy-2-line.svg"),
);

const AddIcon = importSvg(
  () => import("assets/icons/header/IA-POC/add-circle-line.svg"),
);

const LibraryIcon = importSvg(
  () => import("assets/icons/header/IA-POC/box-3-line.svg"),
);

const SettingsIcon = importSvg(
  () => import("assets/icons/header/IA-POC/settings-3-line.svg"),
);

const SideBarContainer = styled.div`
  background-color: white;
  margin-top: 4px;
  border-top-right-radius: 4px;
  grid-row-start: 1;
  grid-row-end: 3;
  padding: 5px 2px;
  display: grid;
  grid-template-rows: 1fr max-content;
`;

const TopButtons = styled.div`
  display: grid;
  grid-gap: 5px;
  grid-auto-rows: max-content;
  align-items: flex-start;
`;

const BottomButtons = styled.div`
  display: grid;
  grid-gap: 5px;
  grid-auto-rows: max-content;
  align-items: flex-end;
`;

const ButtonContainer = styled.div`
  &:hover {
    cursor: pointer;
    background-color: #f1f5f9;
  }
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  &.selected {
    background: #fbe6dc;
  }
  svg {
    height: 24px;
    width: 24px;

    path {
      fill: #4c5664;
    }
  }
`;

const IconButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
  padding: 7px 3px;
  border-radius: 4px;
  span {
    color: #546072;
    font-size: 10px;
    font-weight: 400;
    line-height: 14px;
    text-align: center;
  }
`;

const Sidebar = () => {
  return (
    <SideBarContainer>
      <TopButtons>
        <IconButtonContainer>
          <ButtonContainer>
            <DataIcon />
          </ButtonContainer>
          <span>Data</span>
        </IconButtonContainer>
        <IconButtonContainer>
          <ButtonContainer>
            <PagesIcon />
          </ButtonContainer>
          <span>Pages</span>
        </IconButtonContainer>
        <IconButtonContainer>
          <ButtonContainer>
            <AddIcon />
          </ButtonContainer>
          <span>Add</span>
        </IconButtonContainer>
      </TopButtons>
      <BottomButtons>
        <IconButtonContainer>
          <ButtonContainer>
            <LibraryIcon />
          </ButtonContainer>
        </IconButtonContainer>
        <IconButtonContainer>
          <ButtonContainer>
            <SettingsIcon />
          </ButtonContainer>
        </IconButtonContainer>
      </BottomButtons>
    </SideBarContainer>
  );
};

export default Sidebar;
