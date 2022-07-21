import React from "react";
import styled from "styled-components";
import { Text, TextType } from "design-system";
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
  background-color: ${Colors.SEA_SHELL};
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
  height: 168px;
  object-fit: cover;
`;

const REQUEST_TEMPLATE_URL =
  "https://app.appsmith.com/applications/6241b5a8c99df2369931a653/pages/6241b5a8c99df2369931a656";

function RequestTemplate() {
  const onClick = () => {
    window.open(REQUEST_TEMPLATE_URL);
  };

  return (
    <Wrapper>
      <StyledImage src={RequestTemplateSvg} />
      <Text className={"title"} type={TextType.H1}>
        {createMessage(COULDNT_FIND_TEMPLATE)}
      </Text>
      <Text className={"description"} type={TextType.P1}>
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
