import React, { useEffect } from "react";
import styled from "styled-components";
import { Text, TextType } from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import {
  selectURLSlugs,
  showCanvasTopSectionSelector,
} from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import { generateTemplateFormURL } from "@appsmith/RouteBuilder";
import { useParams } from "react-router";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import { showTemplatesModal as showTemplatesModalAction } from "actions/templateActions";
import {
  createMessage,
  GENERATE_PAGE,
  GENERATE_PAGE_DESCRIPTION,
  TEMPLATE_CARD_DESCRIPTION,
  TEMPLATE_CARD_TITLE,
} from "@appsmith/constants/messages";
import { deleteCanvasCardsState } from "actions/editorActions";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { Icon } from "design-system";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "../../../layoutSystems/common/useLayoutSystemFeatures";

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
  border: solid 1px var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg);
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: var(--ads-v2-border-radius);
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
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: ${(props) => props.theme.spaces[7]}px;
`;

interface routeId {
  applicationSlug: string;
  pageId: string;
  pageSlug: string;
}

const goToGenPageForm = ({ pageId }: routeId): void => {
  AnalyticsUtil.logEvent("GEN_CRUD_PAGE_ACTION_CARD_CLICK");
  history.push(generateTemplateFormURL({ pageId }));
};

interface EmptyCanvasPromptsProps {
  isPreview: boolean;
}

/**
 * OldName: CanvasTopSection
 */
/**
 * This Component encompasses the prompts for empty canvas
 * prompts like generate crud app or import from template
 * @param props Object that contains
 * @prop isPreview, boolean to indicate preview mode
 * @returns
 */
function EmptyCanvasPrompts(props: EmptyCanvasPromptsProps) {
  const dispatch = useDispatch();
  const showCanvasTopSection = useSelector(showCanvasTopSectionSelector);
  const { isPreview } = props;
  const { pageId } = useParams<ExplorerURLParams>();
  const { applicationSlug, pageSlug } = useSelector(selectURLSlugs);

  const checkLayoutSystemFeatures = useLayoutSystemFeatures();
  const [enableForkingFromTemplates] = checkLayoutSystemFeatures([
    LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES,
  ]);

  useEffect(() => {
    if (!showCanvasTopSection && !isPreview) {
      dispatch(deleteCanvasCardsState());
    }
  }, [showCanvasTopSection, isPreview]);

  if (!showCanvasTopSection || isPreview) return null;

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

  const isAirgappedInstance = isAirgapped();

  return (
    <Wrapper data-testid="canvas-ctas">
      {enableForkingFromTemplates && !isAirgappedInstance && (
        <Card data-testid="start-from-template" onClick={showTemplatesModal}>
          <Icon name="layout-2-line" size="lg" />
          <Content>
            <Text color={"var(--ads-v2-color-fg-emphasis)"} type={TextType.H5}>
              {createMessage(TEMPLATE_CARD_TITLE)}
            </Text>
            <Text type={TextType.P3}>
              {createMessage(TEMPLATE_CARD_DESCRIPTION)}
            </Text>
          </Content>
        </Card>
      )}
      <Card
        centerAlign={false}
        data-testid="generate-app"
        onClick={onGeneratePageClick}
      >
        <Icon name="database-2-line" size="lg" />
        <Content>
          <Text color={"var(--ads-v2-color-fg-emphasis)"} type={TextType.H5}>
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

export default EmptyCanvasPrompts;
