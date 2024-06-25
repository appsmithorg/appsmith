import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";

const Container = styled(Flex)`
  height: calc(100vh - 40px);
  width: 100vw;
`;

const Sidebar = styled.aside`
  width: 50px;
  height: 100%;
  border-right: 1px solid var(--ads-v2-color-border);
  background-color: #2a002b;
`;

const LeftPaneContainer = styled.div`
  height: 100%;
  border-right: 1px solid var(--ads-v2-color-border);
  width: 300px;
`;

const MainPaneContainer = styled.div`
  flex: 1;
  height: 100%;
  transition: all 0.3s ease-in;
`;

const RightPaneContainer = styled.div`
  width: 200px;
  height: 100%;
  border-left: 1px solid var(--ads-v2-color-border);
`;

interface ContainerProps {
  children: React.ReactNode[];
}

const Body = ({ children }: ContainerProps) => {
  return (
    <Container>
      <Sidebar />
      {children}
    </Container>
  );
};

const LeftPane = ({ children }: ContainerProps) => {
  return <LeftPaneContainer>{children}</LeftPaneContainer>;
};

const MainPane = ({ children }: ContainerProps) => {
  return <MainPaneContainer>{children}</MainPaneContainer>;
};

const RightPane = ({ children }: ContainerProps) => {
  return <RightPaneContainer>{children}</RightPaneContainer>;
};

Body.LeftPane = LeftPane;
Body.MainPane = MainPane;
Body.RightPane = RightPane;

export default Body;
