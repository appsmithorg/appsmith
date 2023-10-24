import React from "react";
import { Icon, Text } from "design-system";
import styled from "styled-components";

interface Props {
  title?: string;
  selected: boolean;
  icon: string;
  onClick: () => void;
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 50px;
  text-align: center;
  align-items: center;
  gap: 5px;
  padding: 8px 0;
`;

const IconContainer = styled.div<{ selected: boolean }>`
  padding: 2px;
  background-color: ${(props) =>
    props.selected ? "var(--ads-v2-color-bg-muted)" : "white"};
  border-radius: 3px;
  width: 28px;
  cursor: pointer;
`;

function SidebarButton(props: Props) {
  return (
    <Container>
      <IconContainer onClick={props.onClick} selected={props.selected}>
        <Icon name={props.icon} size="lg" />
      </IconContainer>
      {props.title ? <Text kind="body-s">{props.title}</Text> : null}
    </Container>
  );
}

export default SidebarButton;
