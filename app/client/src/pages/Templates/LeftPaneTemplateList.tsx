import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { getTemplatesSelector } from "selectors/templatesSelectors";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import { TEMPLATE_ID_URL } from "constants/routes";
import history from "utils/history";
import { Classes } from "components/ads/common";

const Wrapper = styled.div`
  overflow: auto;
  height: 100%;
  box-shadow: 1px 0px 0px #ededed;
  width: ${(props) => props.theme.homePage.sidebar}px;
  padding-left: 32px;
  padding-top: 34px;

  .title {
    margin-bottom: 10px;
  }

  .list-wrapper {
    margin-top: 10px;
  }
`;

const TemplateItem = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-left: 10px;
  padding: 7px 15px 7px 10px;
  .${Classes.TEXT} {
    color: #121826;
  }
  ${(props) =>
    props.selected &&
    `
    background-color: #ebebeb;
    .${Classes.TEXT} {
      color: #22223B;
    }
  `}

  &:hover {
    background-color: #ebebeb;
  }
`;

function LeftPaneTemplateList() {
  const templates = useSelector(getTemplatesSelector);
  const params = useParams<{ templateId: string }>();

  const onClick = (id: string) => {
    history.push(TEMPLATE_ID_URL(id));
  };

  return (
    <Wrapper>
      <Text className={"title"} type={TextType.BUTTON_MEDIUM}>
        TEMPLATES
      </Text>
      <div className="list-wrapper">
        {templates.map((template) => {
          return (
            <TemplateItem
              key={template.id}
              onClick={() => onClick(template.id)}
              selected={template.id === params.templateId}
            >
              <Text color="#121826" type={TextType.P1}>
                {template.title}
              </Text>
            </TemplateItem>
          );
        })}
      </div>
    </Wrapper>
  );
}

export default LeftPaneTemplateList;
