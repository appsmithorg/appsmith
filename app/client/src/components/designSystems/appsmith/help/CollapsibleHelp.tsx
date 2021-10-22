import React, { ReactNode } from "react";
// import { Button, Collapse, Pre } from "@blueprintjs/core";
import { Icon } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";

interface CollapsibleHelpProps {
  children?: ReactNode;
}

const HelpIcon = styled(Icon)`
  margin-right: 14.5px;
  margin-left: 4px;
  height: 100%;
  background-color: #ef7541;
  border: 2px solid rgba(239, 123, 99);
  border-radius: 50%;
`;

const Container = styled.div`
  background-color: rgba(239, 123, 99, 0.15);
  padding: 10px 10px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;

  margin-top: 18px;
  margin-bottom: 19px;
  margin-left: 6px;
  width: 89%;
`;

const LeftBar = styled.div`
  width: 2px;
  background-color: #ef7541;
  position: absolute;
  left: 0;
  height: 100%;
`;

export default function CollapsibleHelp(props: CollapsibleHelpProps) {
  //   const [isOpen, setIsOpen] = useState(false);
  return (
    <Container>
      <LeftBar />
      <HelpIcon color={"#FDEBE8"} icon="help" />
      <div>{props.children}</div>
    </Container>
  );
}
