import React from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import RequestTemplateSvg from "assets/images/request-template.svg";
import { Button, Size } from "components/ads";
import { Colors } from "constants/Colors";
import {
  COULDNT_FIND_TEMPLATE,
  createMessage,
  COULDNT_FIND_TEMPLATE_DESCRIPTION,
  REQUEST_TEMPLATE,
} from "@appsmith/constants/messages";

const Wrapper = styled.div`
  border: 1px solid ${Colors.GEYSER_LIGHT};
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spaces[11]}px;
  background-color: rgba(248, 248, 248, 0.5);
  transition: all 1s ease-out;
  margin-bottom: ${(props) => props.theme.spaces[12]}px;

  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
  }

  .title {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }

  .description {
    margin-top: ${(props) => props.theme.spaces[2]}px;
  }

  .button {
    margin-top: ${(props) => props.theme.spaces[8]}px;
    max-width: 229px;
    height: ${(props) => props.theme.spaces[13]}px;
    padding: ${(props) =>
      `${props.theme.spaces[0]}px ${props.theme.spaces[6]}px`};
  }
`;

const StyledImage = styled.img`
  height: 147px;
  object-fit: cover;
`;

function RequestTemplate() {
  const onClick = () => {
    window.open(
      "https://github.com/appsmithorg/appsmith/issues/new?assignees=Kocharrahul8&labels=Example+Apps&template=Templates.yaml&title=%5BTemplate%5D%3A+",
    );
  };

  return (
    <Wrapper>
      <StyledImage src={RequestTemplateSvg} />
      <Text className={"title"} type={TextType.H4}>
        {createMessage(COULDNT_FIND_TEMPLATE)}
      </Text>
      <Text className={"description"} type={TextType.P2}>
        {createMessage(COULDNT_FIND_TEMPLATE_DESCRIPTION)}
      </Text>
      <Button
        className="button"
        onClick={onClick}
        size={Size.large}
        tag="button"
        text={createMessage(REQUEST_TEMPLATE)}
      />
    </Wrapper>
  );
}

export default RequestTemplate;
