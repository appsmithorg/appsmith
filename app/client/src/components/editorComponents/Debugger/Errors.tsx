import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getFilteredErrors } from "selectors/debuggerSelectors";
import LogItem, { getLogItemProps } from "./LogItem";
import { BlankState } from "./helpers";
import { createMessage, NO_ERRORS } from "@appsmith/constants/messages";
import { getCurrentUser } from "selectors/usersSelectors";
import bootIntercom from "utils/bootIntercom";
import { thinScrollbar } from "constants/DefaultTheme";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow: auto;
  ${thinScrollbar};
  height: 100%;
  padding-bottom: 25px;
`;

function Errors(props: { hasShortCut?: boolean }) {
  const errors = useSelector(getFilteredErrors);
  const currentUser = useSelector(getCurrentUser);

  useEffect(() => {
    bootIntercom(currentUser);
  }, [currentUser?.email]);

  return (
    <ContainerWrapper>
      <ListWrapper className="debugger-list">
        {!Object.values(errors).length ? (
          <BlankState
            hasShortCut={props.hasShortCut}
            placeholderText={createMessage(NO_ERRORS)}
          />
        ) : (
          Object.values(errors).map((e, index) => {
            const logItemProps = getLogItemProps(e);
            // Expand all errors by default
            return (
              <LogItem key={`debugger-${index}`} {...logItemProps} expand />
            );
          })
        )}
      </ListWrapper>
    </ContainerWrapper>
  );
}

export default Errors;
