import React from "react";
import styled from "styled-components";
import { Intent } from "constants/DefaultTheme";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Link } from "react-router-dom";

export type MessageAction = {
  url?: string;
  onClick?: () => void;
  text: string;
  intent: Intent;
};

const StyledMessage = styled.div<{ intent: Intent }>`
  & {
    ${(props) => getTypographyByKey(props, "p1")}
    width: 100%;
    padding: ${(props) => props.theme.spaces[4]}px;
    color: ${(props) => props.theme.colors.formMessage.text[props.intent]};
    background-color: ${(props) =>
      props.theme.colors.formMessage.background[props.intent]};
  }
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledAction = styled.div<{ intent: Intent }>`
  margin-top: ${(props) => props.theme.spaces[5]}px;
  ${(props) => getTypographyByKey(props, "h5")}
  font-weight: 600;
  & a {
    text-decoration: none;
    color: ${(props) => props.theme.colors.formMessage.text[props.intent]};
  }
`;

export function ActionButton(props: MessageAction) {
  if (props.url) {
    const isExternal = props.url.indexOf("//") !== -1;
    return (
      <StyledAction intent={props.intent}>
        {isExternal ? (
          <a href={props.url} rel="noreferrer" target="_blank">
            {props.text}
          </a>
        ) : (
          <Link to={props.url}>{props.text}</Link>
        )}
      </StyledAction>
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

export type FormMessageProps = {
  intent: Intent;
  message: string;
  actions?: MessageAction[];
};

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
