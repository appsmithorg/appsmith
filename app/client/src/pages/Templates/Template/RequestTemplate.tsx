import React from "react";
import styled from "styled-components";
import { Text, TextType } from "@appsmith/ads-old";
import { Button } from "@appsmith/ads";
import RequestTemplateSvg from "assets/images/request-template.svg";
import {
  COULDNT_FIND_TEMPLATE,
  createMessage,
  COULDNT_FIND_TEMPLATE_DESCRIPTION,
  REQUEST_TEMPLATE,
  REQUEST_BUILDING_BLOCK,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const Wrapper = styled.div`
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spaces[11]}px;
  background-color: var(--ads-v2-color-bg-subtle);
  margin-bottom: ${(props) => props.theme.spaces[12]}px;
  cursor: pointer;

  &:hover {
    border-color: var(--ads-v2-color-border-emphasis);
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

interface RequestTemplateProps {
  isBuildingBlock?: boolean;
}

function RequestTemplate(props: RequestTemplateProps) {
  const REQUEST_TEXT = props.isBuildingBlock
    ? createMessage(REQUEST_BUILDING_BLOCK)
    : createMessage(REQUEST_TEMPLATE);

  const onClick = () => {
    AnalyticsUtil.logEvent("REQUEST_NEW_TEMPLATE");
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
        {REQUEST_TEXT}
      </Button>
    </Wrapper>
  );
}

export default RequestTemplate;
