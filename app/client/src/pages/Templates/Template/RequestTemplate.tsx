import React from "react";
import styled from "styled-components";
import { Text, TextType } from "design-system-old";
import { Button } from "design-system";
import RequestTemplateSvg from "assets/images/request-template.svg";
import {
  COULDNT_FIND_TEMPLATE,
  createMessage,
  COULDNT_FIND_TEMPLATE_DESCRIPTION,
  REQUEST_TEMPLATE,
} from "@appsmith/constants/messages";

const Wrapper = styled.div`
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spaces[11]}px;
  background-color: var(--ads-v2-color-bg-subtle);
  transition: all 1s ease-out;
  margin-bottom: ${(props) => props.theme.spaces[12]}px;

  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
  }

  .title {
    color: var(--ads-v2-color-fg-emphasis-plus);
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }

  .description {
    color: var(--ads-v2-color-fg);
    margin-top: ${(props) => props.theme.spaces[2]}px;
  }

  .button {
    margin-top: ${(props) => props.theme.spaces[8]}px;
    max-width: 229px;
  }
`;

const StyledImage = styled.img`
  height: 168px;
  object-fit: cover;
  border-radius: var(--ads-v2-border-radius);
`;

const REQUEST_TEMPLATE_URL =
  "https://app.appsmith.com/app/request-templates/request-list-6241c12fc99df2369931a714";

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
      <Button className="button" onClick={onClick} size="md">
        {createMessage(REQUEST_TEMPLATE)}
      </Button>
    </Wrapper>
  );
}

export default RequestTemplate;
