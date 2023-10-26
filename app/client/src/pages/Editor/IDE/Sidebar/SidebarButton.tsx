import React from "react";
import { Icon, Text } from "design-system";
import styled from "styled-components";

interface Props {
  title?: string;
  selected: boolean;
  icon: string;
  onClick: () => void;
  className?: string;
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
    props.selected ? "var(--colors-raw-orange-100, #fbe6dc)" : "white"};
  border-radius: 3px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background: var(--colors-ui-content-surface-hover-bg, #f1f5f9);
  }
`;

function SidebarButton(props: Props) {
  return (
    <Container>
      <IconContainer
        className={props.className}
        onClick={props.onClick}
        selected={props.selected}
      >
        <Icon name={props.icon} size="lg" />
      </IconContainer>
      {props.title ? <Text kind="body-s">{props.title}</Text> : null}
    </Container>
  );
}

export default SidebarButton;
