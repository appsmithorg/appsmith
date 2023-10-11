import React from "react";
import { Icon, Text } from "design-system";
import styled from "styled-components";

interface Props {
  title: string;
  selected: boolean;
  icon: string;
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  height: 64px;
  width: 50px;
  svg {
    width: 24px;
    height: 24px;
  }
  text-align: center;
  align-items: center;
  gap: 5px;
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
      <IconContainer selected={props.selected}>
        <Icon name={props.icon} size="md" />
      </IconContainer>
      <Text kind="body-s">{props.title}</Text>
    </Container>
  );
}

export default SidebarButton;
