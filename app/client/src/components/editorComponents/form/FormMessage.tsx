import React from "react";
import styled from "styled-components";
import tinycolor from "tinycolor2";
import {
  Intent,
  BlueprintButtonIntentsCSS,
  IntentIcons,
  IntentColors,
  getColorWithOpacity,
} from "constants/DefaultTheme";
import Button from "components/editorComponents/Button";

export type MessageAction = {
  url?: string;
  onClick?: () => void;
  text: string;
  intent: Intent;
};

const StyledMessage = styled.div`
  & {
    width: 100%;
    padding: ${(props) => props.theme.spaces[8]}px;
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    background: ${(props) =>
      getColorWithOpacity(props.theme.colors.messageBG, 0.4)};
    text-align: left;
    margin-bottom: ${(props) => props.theme.spaces[4]}px;
  }
`;

const MessageContainer = styled.div<{ iconbgcolor: string }>`
  & {
    display: flex;
    justify-content: flex-start;
    & > div {
      position: relative;
      align-self: flex-start;
      &:before {
        content: "";
        position: absolute;
        width: 32px;
        height: 32px;
        background: ${(props) => props.iconbgcolor};
        border-radius: 50%;
        left: -6px;
        top: -6px;
        z-index: 0;
      }
      svg {
        position: aboslute;
        z-index: 1;
      }
    }
    p {
      margin: 0 ${(props) => props.theme.spaces[8]}px;
      align-self: flex-start;
    }
  }
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-left: 38px;
  margin: ${(props) => props.theme.spaces[6]}px 0 0 38px;

  & .appsmith-message-action-button {
    border: none;
    ${BlueprintButtonIntentsCSS}
  }
`;

export function ActionButton(props: MessageAction) {
  if (props.url) {
    return (
      <Button
        className="appsmith-message-action-button"
        filled
        href={props.url}
        intent="primary"
        size="small"
        text={props.text}
      />
    );
  } else if (props.onClick) {
    return (
      <Button
        className="appsmith-message-action-button"
        filled
        intent="primary"
        onClick={props.onClick}
        size="small"
        text={props.text}
      />
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
      <ActionButton key={action.text} {...action} />
    ));
  const Icon = IntentIcons[props.intent];
  const iconbgcolor = tinycolor(IntentColors[props.intent])
    .lighten()
    .setAlpha(0.2)
    .toString();
  return (
    <StyledMessage>
      <MessageContainer iconbgcolor={iconbgcolor}>
        <Icon color={IntentColors[props.intent]} height={20} width={20} />
        <p>{props.message}</p>
      </MessageContainer>
      {actions && <ActionsContainer>{actions}</ActionsContainer>}
    </StyledMessage>
  );
}

export default FormMessage;
