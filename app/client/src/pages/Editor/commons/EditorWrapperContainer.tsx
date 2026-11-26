import React from "react";
import styled from "styled-components";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { IDE_HEADER_HEIGHT } from "@appsmith/ads";
import { BOTTOM_BAR_HEIGHT } from "../../../components/BottomBar/constants";
import { PROTECTED_CALLOUT_HEIGHT } from "pages/AppIDE/components/ProtectedCallout/ProtectedCallout";
import { useGitProtectedMode } from "../gitSync/hooks/modHooks";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

interface EditorWrapperContainerProps {
  children: React.ReactNode;
  // Height in px of other banners shown above the editor, such as the
  // Appsmith AI queries banner. The protected-branch banner is counted
  // separately, so do not include it.
  topOffset?: number;
}

const Wrapper = styled.div<{
  isProtectedMode: boolean;
  topOffset: number;
}>`
  display: flex;
  height: calc(
    100vh - ${IDE_HEADER_HEIGHT}px - ${BOTTOM_BAR_HEIGHT}px -
      ${(props) =>
        props.isProtectedMode ? PROTECTED_CALLOUT_HEIGHT + "px" : "0px"} -
      ${(props) => props.topOffset}px
  );
  background-color: ${(props) => props.theme.appBackground};
`;

function EditorWrapperContainer({
  children,
  topOffset = 0,
}: EditorWrapperContainerProps) {
  const isCombinedPreviewMode = useSelector(selectCombinedPreviewMode);
  const isProtectedMode = useGitProtectedMode();

  return (
    <Wrapper
      className={classNames({
        [`relative w-full overflow-x-hidden`]: true,
        "select-none": !isCombinedPreviewMode,
      })}
      isProtectedMode={isProtectedMode}
      topOffset={topOffset}
    >
      {children}
    </Wrapper>
  );
}

export default EditorWrapperContainer;
