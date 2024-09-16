import type { SyntheticEvent } from "react";
import React, { memo, useRef, useCallback, useEffect } from "react";
import _debounce from "lodash/debounce";
import styled from "styled-components";
import ErrorLogItem, { getLogItemProps } from "./ErrorLogItem";
import { BlankState } from "../helpers";
import { createMessage, NO_ERRORS } from "ee/constants/messages";
import { thinScrollbar } from "constants/DefaultTheme";
import type { Log } from "entities/AppsmithConsole";
import { setResponsePaneScrollPosition } from "actions/debuggerActions";
import { useDispatch, useSelector } from "react-redux";
import { getScrollPosition } from "selectors/debuggerSelectors";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow-wrap: anywhere;
  overflow: auto;
  ${thinScrollbar};
  height: 100%;
  padding-bottom: 37px;
`;

// This component is used to render the error logs in the debugger.
const ErrorLog = (props: {
  errors: Record<string, Log>;
  hasShortCut?: boolean;
}) => {
  const dispatch = useDispatch();
  const errorScrollRef = useRef<HTMLDivElement>(null);
  //get scroll position of the error logs.
  const scrollPosition = useSelector(getScrollPosition);
  // Update the scroll position of the error logs.
  useEffect(() => {
    errorScrollRef.current?.scroll(0, scrollPosition);
  }, []);
  // This function is used to store the scroll position of the error logs.
  const logScrollPosition = (e: SyntheticEvent) => {
    const target = e.target as HTMLTextAreaElement;
    dispatch(setResponsePaneScrollPosition(target.scrollTop));
  };
  // This function is used to debounce the scroll event of the error logs.
  const debounceLogScrollFn = useCallback(
    _debounce(logScrollPosition, 200),
    [],
  );

  // returns array of log items for each error in the error log.
  const getLogItem = (error: Log, index: number) => {
    const logItemProps = getLogItemProps(error);
    const messages = error.messages || [];
    const logItems = [];
    if (messages.length) {
      messages.forEach((message) => {
        logItemProps.messages = [message];
        logItems.push(
          <ErrorLogItem key={`debugger-${index}`} {...logItemProps} />,
        );
      });
    } else {
      logItems.push(
        <ErrorLogItem key={`debugger-${index}`} {...logItemProps} />,
      );
    }
    return logItems;
  };

  return (
    <ContainerWrapper>
      <ListWrapper
        className="debugger-list"
        onScroll={(e) => debounceLogScrollFn(e)}
        ref={errorScrollRef}
      >
        {!Object.values(props.errors).length ? (
          <BlankState
            hasShortCut={props.hasShortCut}
            placeholderText={createMessage(NO_ERRORS)}
          />
        ) : (
          Object.values(props.errors).map((error, index) => {
            return getLogItem(error, index);
          })
        )}
      </ListWrapper>
    </ContainerWrapper>
  );
};

// Memoizing the component to avoid unnecessary re-renders
export default memo(ErrorLog);
