import React, { useCallback } from "react";
import styled from "styled-components";
import { importSvg } from "design-system-old";
import { IDEAppState } from "./ideReducer";
import classNames from "classnames";
import { builderURL } from "RouteBuilder";
import history from "utils/history";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "../../selectors/editorSelectors";

const DataIcon = importSvg(
  () => import("pages/IDE/assets/icons/database-2-line.svg"),
);

const PagesIcon = importSvg(
  () => import("pages/IDE/assets/icons/file-copy-2-line.svg"),
);

const AddIcon = importSvg(
  () => import("pages/IDE/assets/icons/add-circle-line.svg"),
);

const LibraryIcon = importSvg(
  () => import("pages/IDE/assets/icons/box-3-line.svg"),
);

const SettingsIcon = importSvg(
  () => import("pages/IDE/assets/icons/settings-3-line.svg"),
);

const SideBarContainer = styled.div`
  background-color: white;
  border-top-right-radius: 4px;
  grid-row-start: 1;
  grid-row-end: 3;
  padding: 5px 2px;
  display: grid;
  grid-template-rows: 1fr max-content;
  height: 100%;
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
  const params = useParams<{
    ideState: IDEAppState;
    appId: string;
  }>();
  const currentPage = useSelector(getCurrentPageId);
  const selectedState = params.ideState;
  const setAppState = useCallback((state: IDEAppState) => {
    history.push(
      builderURL({
        ideState: state,
        appId: params.appId,
        pageId: currentPage,
      }),
    );
  }, []);
  return (
    <SideBarContainer>
      <TopButtons>
        <IconButtonContainer>
          <ButtonContainer
            className={classNames({
              selected: selectedState === IDEAppState.Data,
            })}
            onClick={() => setAppState(IDEAppState.Data)}
          >
            <DataIcon />
          </ButtonContainer>
          <span>Data</span>
        </IconButtonContainer>
        <IconButtonContainer>
          <ButtonContainer
            className={classNames({
              selected: selectedState === IDEAppState.Page,
            })}
            onClick={() => setAppState(IDEAppState.Page)}
          >
            <PagesIcon />
          </ButtonContainer>
          <span>Pages</span>
        </IconButtonContainer>
        <IconButtonContainer>
          <ButtonContainer
            className={classNames({
              selected: selectedState === IDEAppState.Add,
            })}
            onClick={() => setAppState(IDEAppState.Add)}
          >
            <AddIcon />
          </ButtonContainer>
          <span>Add</span>
        </IconButtonContainer>
      </TopButtons>
      <BottomButtons>
        <IconButtonContainer>
          <ButtonContainer
            className={classNames({
              selected: selectedState === IDEAppState.Libraries,
            })}
            onClick={() => setAppState(IDEAppState.Libraries)}
          >
            <LibraryIcon />
          </ButtonContainer>
        </IconButtonContainer>
        <IconButtonContainer>
          <ButtonContainer
            className={classNames({
              selected: selectedState === IDEAppState.Settings,
            })}
            onClick={() => setAppState(IDEAppState.Settings)}
          >
            <SettingsIcon />
          </ButtonContainer>
        </IconButtonContainer>
      </BottomButtons>
    </SideBarContainer>
  );
};

export default Sidebar;
