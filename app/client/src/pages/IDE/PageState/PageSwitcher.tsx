import React from "react";
import styled from "styled-components";
import { Button, Text } from "design-system";
import { useSelector } from "react-redux";
import {
  getCurrentPageName,
  getPageList,
} from "../../../selectors/editorSelectors";

const Container = styled.div`
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 4px;
`;

const SwitchMode = styled.div`
  display: grid;
  grid-template-columns: 1fr 40px;
  background-color: #fbe6dc;
  flex: 1;
  height: 100%;
  align-items: center;
  padding: 5px;
  border-radius: 4px;
`;

type Props = {
  isSwitchMode: boolean;
  setSwitchMode: (setMode: boolean) => void;
};

const PageSwitcher = (props: Props) => {
  const currentPageName = useSelector(getCurrentPageName);
  const pageList = useSelector(getPageList);
  return (
    <Container>
      {props.isSwitchMode && (
        <SwitchMode>
          <Text kind="heading-s">Pages({pageList.length})</Text>
          <Button
            endIcon="cross"
            kind="tertiary"
            onClick={() => props.setSwitchMode(false)}
            size="sm"
          />
        </SwitchMode>
      )}
      {!props.isSwitchMode && (
        <Button
          endIcon="arrow-down-s-line"
          kind="tertiary"
          onClick={() => props.setSwitchMode(true)}
          size="md"
          startIcon={"page-line"}
        >
          {currentPageName}
        </Button>
      )}
    </Container>
  );
};

export default PageSwitcher;
