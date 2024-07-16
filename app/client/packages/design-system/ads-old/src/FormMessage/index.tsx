import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "../constants/typography";

const formMessage: { [char: string]: { [char: string]: string } } = {
  text: {
    primary: "var(--ads-form-message-primary-text-color)",
    danger: "var(--ads-form-message-danger-text-color)",
    success: "var(--ads-form-message-success-text-color)",
    warning: "var(--ads-form-message-warning-text-color)",
    lightSuccess: "var(--ads-form-message-light-success-text-color)",
  },
  background: {
    primary: "var(--ads-form-message-primary-background-color)",
    danger: "var(--ads-form-message-danger-background-color)",
    success: "var(--ads-form-message-success-background-color)",
    warning: "var(--ads-form-message-warning-background-color)",
    lightSuccess: "var(--ads-form-message-light-success-background-color)",
  },
};

type Intent = "primary" | "danger" | "success" | "warning" | "lightSuccess";

export interface MessageAction {
  linkElement?: any;
  onClick?: () => void;
  text: string;
  intent: Intent;
}

const StyledMessage = styled.div<{ intent: Intent }>`
  & {
    ${getTypographyByKey("p1")}
    width: 100%;
    padding: var(--ads-spaces-4);
    color: ${(props) => formMessage.text[props.intent]};
    background-color: ${(props) => formMessage.background[props.intent]};
  }
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledAction = styled.div<{ intent: Intent }>`
  margin-top: var(--ads-spaces-5);
  ${getTypographyByKey("h5")}
  font-weight: 600;
  & a {
    text-decoration: none;
    color: ${(props) => formMessage.text[props.intent]};
  }
`;

export function ActionButton(props: MessageAction) {
  if (props.linkElement) {
    return (
      <StyledAction intent={props.intent}>{props.linkElement}</StyledAction>
    );
  } else if (props.onClick) {
    return (
      <StyledAction intent={props.intent} onClick={props.onClick}>
        {props.text}
      </StyledAction>
    );
  }
  return null;
}

export interface FormMessageProps {
  intent: Intent;
  message: string;
  actions?: MessageAction[];
  linkAs?: any;
}

export function FormMessage(props: FormMessageProps) {
  const actions =
    props.actions &&
    props.actions.map((action) => (
      <ActionButton key={action.text} {...action} intent={props.intent} />
    ));
  return (
    <StyledMessage className="form-message-container" intent={props.intent}>
      {props.message}
      {actions && <ActionsContainer>{actions}</ActionsContainer>}
    </StyledMessage>
  );
}

export default FormMessage;
