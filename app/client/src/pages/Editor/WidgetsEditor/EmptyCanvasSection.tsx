import React, { useEffect } from "react";
import styled from "styled-components";
import { ReactComponent as Layout } from "assets/images/layout.svg";
import { ReactComponent as Database } from "assets/images/database.svg";
import { Text, TextType } from "design-system";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import {
  previewModeSelector,
  selectURLSlugs,
  showCanvasTopSectionSelector,
} from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import { generateTemplateFormURL } from "RouteBuilder";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Explorer/helpers";
import { showTemplatesModal as showTemplatesModalAction } from "actions/templateActions";
import {
  createMessage,
  GENERATE_PAGE,
  GENERATE_PAGE_DESCRIPTION,
  TEMPLATE_CARD_DESCRIPTION,
  TEMPLATE_CARD_TITLE,
} from "@appsmith/constants/messages";
import { selectFeatureFlags } from "selectors/usersSelectors";
import FeatureFlags from "entities/FeatureFlags";
import { deleteCanvasCardsState } from "actions/editorActions";

const Wrapper = styled.div`
  margin: ${(props) =>
    `${props.theme.spaces[7]}px ${props.theme.spaces[16]}px 0px ${props.theme.spaces[13]}px`};
  display: flex;
  flex-direction: row;
  gap: ${(props) => props.theme.spaces[7]}px;
`;

const Card = styled.div<{ centerAlign?: boolean }>`
  padding: ${(props) =>
    `${props.theme.spaces[5]}px ${props.theme.spaces[9]}px`};
  border: solid 1px ${Colors.GREY_4};
  background-color: ${Colors.WHITE};
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  ${(props) =>
    props.centerAlign &&
    `
    justify-content: center;
  `}
  cursor: pointer;

  svg {
    height: 24px;
    width: 24px;
  }

  &:hover svg path {
    fill: var(--appsmith-color-orange-500);
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: ${(props) => props.theme.spaces[7]}px;
`;

type routeId = {
  applicationSlug: string;
  pageId: string;
  pageSlug: string;
};

const goToGenPageForm = ({ pageId }: routeId): void => {
  AnalyticsUtil.logEvent("GEN_CRUD_PAGE_ACTION_CARD_CLICK");
  history.push(generateTemplateFormURL({ pageId }));
};

function CanvasTopSection() {
  const dispatch = useDispatch();
  const showCanvasTopSection = useSelector(showCanvasTopSectionSelector);
  const inPreviewMode = useSelector(previewModeSelector);
  const { pageId } = useParams<ExplorerURLParams>();
  const { applicationSlug, pageSlug } = useSelector(selectURLSlugs);
  const featureFlags: FeatureFlags = useSelector(selectFeatureFlags);

  useEffect(() => {
    if (!showCanvasTopSection && !inPreviewMode) {
      dispatch(deleteCanvasCardsState());
    }
  }, [showCanvasTopSection, inPreviewMode]);

  if (!showCanvasTopSection) return null;

  const showTemplatesModal = () => {
    dispatch(showTemplatesModalAction(true));
    AnalyticsUtil.logEvent("CANVAS_BLANK_PAGE_CTA_CLICK", {
      item: "ADD_PAGE_FROM_TEMPLATE",
    });
  };

  const onGeneratePageClick = () => {
    goToGenPageForm({ applicationSlug, pageSlug, pageId });
    AnalyticsUtil.logEvent("CANVAS_BLANK_PAGE_CTA_CLICK", {
      item: "GENERATE_PAGE",
    });
  };

  return (
    <Wrapper data-cy="canvas-ctas">
      {!!featureFlags.TEMPLATES_PHASE_2 && (
        <Card data-cy="start-from-template" onClick={showTemplatesModal}>
          <Layout />
          <Content>
            <Text color={Colors.COD_GRAY} type={TextType.P1}>
              {createMessage(TEMPLATE_CARD_TITLE)}
            </Text>
            <Text type={TextType.P3}>
              {createMessage(TEMPLATE_CARD_DESCRIPTION)}
            </Text>
          </Content>
        </Card>
      )}
      <Card
        centerAlign={!featureFlags.TEMPLATES_PHASE_2}
        data-cy="generate-app"
        onClick={onGeneratePageClick}
      >
        <Database />
        <Content>
          <Text color={Colors.COD_GRAY} type={TextType.P1}>
            {createMessage(GENERATE_PAGE)}
          </Text>
          <Text type={TextType.P3}>
            {createMessage(GENERATE_PAGE_DESCRIPTION)}
          </Text>
        </Content>
      </Card>
    </Wrapper>
  );
}

export default CanvasTopSection;
