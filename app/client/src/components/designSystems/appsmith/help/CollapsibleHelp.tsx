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
  border-radius: 4px;
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
  border: 1px solid #ef7541;
  border-radius: 4px;
  position: absolute;
  top: 1px;
  left: 0;
  height: 96%;
`;

export default function CollapsibleHelp(props: CollapsibleHelpProps) {
  //   const [isOpen, setIsOpen] = useState(false);
  return (
    <Container>
      <LeftBar />
      <HelpIcon color={"#FDEBE8"} icon="help"></HelpIcon>
      <div>{props.children}</div>
    </Container>
  );
}
