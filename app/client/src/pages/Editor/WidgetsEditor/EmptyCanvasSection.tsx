import React from "react";
import styled from "styled-components";
import { ReactComponent as Layout } from "assets/icons/ads/layout-7.svg";
import { ReactComponent as Database } from "assets/icons/ads/database-3.svg";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { useDispatch, useSelector } from "react-redux";
import { previewModeSelector, selectURLSlugs } from "selectors/editorSelectors";
import { commentModeSelector } from "selectors/commentsSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import { generateTemplateFormURL } from "RouteBuilder";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Explorer/helpers";
import { showTemplatesModal as showTemplatesModalAction } from "actions/templateActions";

const Wrapper = styled.div`
  margin: 16px 33px 0px 33px;
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

const Card = styled.div`
  padding: 10px 20px;
  border: solid 1px #e7e7e7;
  background-color: #fff;
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: #f1f1f1;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 16px;
`;

type routeId = {
  applicationSlug: string;
  pageId: string;
  pageSlug: string;
};

const goToGenPageForm = ({
  applicationSlug,
  pageId,
  pageSlug,
}: routeId): void => {
  AnalyticsUtil.logEvent("GEN_CRUD_PAGE_ACTION_CARD_CLICK");
  history.push(generateTemplateFormURL({ applicationSlug, pageSlug, pageId }));
};

function CanvasTopSection() {
  const dispatch = useDispatch();
  const widgets = useSelector(getCanvasWidgets);
  const inPreviewMode = useSelector(previewModeSelector);
  const isCommentMode = useSelector(commentModeSelector);
  const { pageId } = useParams<ExplorerURLParams>();
  const { applicationSlug, pageSlug } = useSelector(selectURLSlugs);

  if (Object.keys(widgets).length > 1 || inPreviewMode || isCommentMode)
    return null;

  const showTemplatesModal = () => {
    dispatch(showTemplatesModalAction(true));
  };

  return (
    <Wrapper>
      <Card onClick={showTemplatesModal}>
        <Layout />
        <Content>
          <Text color={Colors.COD_GRAY} type={TextType.P1}>
            Start from a template
          </Text>
          <Text type={TextType.P3}>
            Create app from template by selecting pages
          </Text>
        </Content>
      </Card>
      <Card
        onClick={() => goToGenPageForm({ applicationSlug, pageSlug, pageId })}
      >
        <Database />
        <Content>
          <Text color={Colors.COD_GRAY} type={TextType.P1}>
            Generate from data table
          </Text>
          <Text type={TextType.P3}>
            Start app with simple CRUD UI and customize it
          </Text>
        </Content>
      </Card>
    </Wrapper>
  );
}

export default CanvasTopSection;
