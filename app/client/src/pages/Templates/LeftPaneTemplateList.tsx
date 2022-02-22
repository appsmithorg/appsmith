import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { getTemplatesSelector } from "selectors/templatesSelectors";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import { TEMPLATE_ID_URL } from "constants/routes";
import history from "utils/history";
import { Classes } from "components/ads/common";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
import { thinScrollbar } from "constants/DefaultTheme";

const Wrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding-left: 16px;
  padding-top: 25px;
  flex-direction: column;
  box-shadow: 1px 0px 0px #ededed;
`;

const TempelateListWrapper = styled.div`
  .title {
    margin-bottom: 10px;
    padding-left: 15px;
  }

  .list-wrapper {
    margin-top: 10px;
    overflow: auto;
    height: calc(100vh - ${(props) => props.theme.homePage.header + 244}px);
    ${thinScrollbar}
  }
`;

const SecondWrapper = styled.div`
  height: calc(100vh - ${(props) => props.theme.homePage.header + 24}px);
  position: relative;
`;

const TemplateItem = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 7px 15px 7px 25px;
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
      <SecondWrapper>
        <TempelateListWrapper>
          <Text className={"title"} type={TextType.SIDE_HEAD}>
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
        </TempelateListWrapper>
        <LeftPaneBottomSection />
      </SecondWrapper>
    </Wrapper>
  );
}

export default LeftPaneTemplateList;
