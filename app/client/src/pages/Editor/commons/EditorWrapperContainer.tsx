import React from "react";
import styled from "styled-components";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "../../../selectors/editorSelectors";

interface EditorWrapperContainerProps {
  children: React.ReactNode;
}

const Wrapper = styled.div`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

function EditorWrapperContainer({ children }: EditorWrapperContainerProps) {
  const isCombinedPreviewMode = useSelector(combinedPreviewModeSelector);

  return (
    <Wrapper
      className={classNames({
        [`relative w-full overflow-x-hidden`]: true,
        "select-none": !isCombinedPreviewMode,
      })}
    >
      {children}
    </Wrapper>
  );
}

export default EditorWrapperContainer;
