import React from "react";
import styled from "styled-components";

interface EditorWrapperContainerProps {
  children: React.ReactNode;
  hasBottomBar?: boolean;
}

const Wrapper = styled.div<{ hasBottomBar?: boolean }>`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => (props.hasBottomBar ? props.theme.bottomBarHeight : "0px")}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

function EditorWrapperContainer({
  children,
  hasBottomBar = true,
}: EditorWrapperContainerProps) {
  return (
    <Wrapper
      className="relative w-full overflow-x-hidden"
      hasBottomBar={hasBottomBar}
    >
      {children}
    </Wrapper>
  );
}

export default EditorWrapperContainer;
