import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { getTemplatesSelector } from "selectors/templatesSelectors";
import styled from "styled-components";
import { Classes, Text, TextType } from "design-system";
import history from "utils/history";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
import { thinScrollbar } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { createMessage, TEMPLATES } from "@appsmith/constants/messages";
import { templateIdUrl } from "RouteBuilder";

const Wrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding-left: ${(props) => props.theme.spaces[7]}px;
  padding-top: ${(props) => props.theme.spaces[11]}px;
  flex-direction: column;
  box-shadow: 1px 0px 0px ${Colors.GALLERY_2};
`;

const TempelateListWrapper = styled.div`
  .title {
    margin-bottom: ${(props) => props.theme.spaces[4]}px;
    padding-left: ${(props) => props.theme.spaces[6] + 1}px;
  }

  .list-wrapper {
    margin-top: ${(props) => props.theme.spaces[4]}px;
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
  padding: ${(props) =>
    `${props.theme.spaces[2]}px ${props.theme.spaces[6]}px ${props.theme.spaces[2]}px ${props.theme.spaces[11]}px`};
  .${Classes.TEXT} {
    color: ${Colors.MIRAGE_2};
  }
  ${(props) =>
    props.selected &&
    `
    background-color: ${Colors.GALLERY_1};
    .${Classes.TEXT} {
      color: ${Colors.EBONY_CLAY_2};
    }
  `}

  &:hover {
    background-color: ${Colors.GALLERY_1};
  }
`;

function LeftPaneTemplateList() {
  const templates = useSelector(getTemplatesSelector);
  const params = useParams<{ templateId: string }>();

  const onClick = (id: string) => {
    history.push(templateIdUrl({ id }));
  };

  return (
    <Wrapper>
      <SecondWrapper>
        <TempelateListWrapper>
          <Text className={"title"} type={TextType.SIDE_HEAD}>
            {createMessage(TEMPLATES)}
          </Text>
          <div className="list-wrapper">
            {templates.map((template) => {
              return (
                <TemplateItem
                  key={template.id}
                  onClick={() => onClick(template.id)}
                  selected={template.id === params.templateId}
                >
                  <Text color={Colors.MIRAGE_2} type={TextType.P1}>
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
