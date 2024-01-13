import React from "react";
import styled from "styled-components";

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
  return (
    <Wrapper className="relative w-full overflow-x-hidden">{children}</Wrapper>
  );
}

export default EditorWrapperContainer;
