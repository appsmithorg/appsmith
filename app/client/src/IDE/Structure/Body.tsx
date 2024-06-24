import React, { useState } from "react";
import { Button, Flex } from "design-system";
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

const LeftPane = styled.div<{ extend: boolean }>`
  height: 100%;
  border-right: 1px solid var(--ads-v2-color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(135, 22, 56, 1);

  width: ${({ extend }) => (extend ? "unset" : "300px")};
  flex: ${({ extend }) => (extend ? "1" : "unset")};
  transition: all 0.3s ease-in;
`;

const MainPane = styled.div<{ stretch: boolean }>`
  width: ${({ stretch }) => (stretch ? "unset" : "0px")};
  flex: ${({ stretch }) => (stretch ? "1" : "unset")};
  height: 100%;
  transition: all 0.3s ease-in;
  background-color: rgba(214, 215, 222, 1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RightPane = styled.div<{ hide: boolean }>`
  width: ${({ hide }) => (hide ? "0px" : "200px")};
  transform: ${({ hide }) => (hide ? "translateX(200px)" : "translateX(0px)")};
  height: 100%;
  border-left: 1px solid var(--ads-v2-color-border);
  transition: all 0.3s ease-in;
  background-color: rgba(92, 92, 172, 1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IDEBody = () => {
  const [extendedPane, setExtendedPane] = useState<string | null>(null);
  return (
    <Container>
      <Sidebar />
      <LeftPane extend={extendedPane === "LeftPane"}>
        {extendedPane === "LeftPane" ? (
          <Button
            onClick={() => {
              setExtendedPane(null);
            }}
          >
            Retract
          </Button>
        ) : (
          <Button
            onClick={() => {
              setExtendedPane("LeftPane");
            }}
          >
            Extend
          </Button>
        )}
      </LeftPane>
      <MainPane stretch={extendedPane === null} />
      <RightPane hide={extendedPane === "LeftPane"} />
    </Container>
  );
};

export default IDEBody;
