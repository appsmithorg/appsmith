import { templateIdUrl } from "ee/RouteBuilder";
import {
  FORK_THIS_TEMPLATE,
  FORK_THIS_TEMPLATE_BUILDING_BLOCK,
  GO_BACK,
  createMessage,
} from "ee/constants/messages";
import { Button, Link, Text } from "@appsmith/ads";
import { useQuery } from "pages/Editor/utils";
import React from "react";
import { useSelector } from "react-redux";
import {
  getActiveTemplateSelector,
  getForkableWorkspaces,
  isImportingTemplateSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import history from "utils/history";
import ForkTemplate from "./ForkTemplate";
import { TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE } from "./constants";

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled(Text)`
  display: inline-block;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

interface Props {
  handleBackPress?: () => void;
  templateId: string;
  onClickUseTemplate?: (id: string) => void;
  showBack: boolean;
}
const SHOW_FORK_MODAL_PARAM = "showForkTemplateModal";

function TemplateViewHeader({
  handleBackPress,
  onClickUseTemplate,
  showBack,
  templateId,
}: Props) {
  const currentTemplate = useSelector(getActiveTemplateSelector);
  const query = useQuery();
  const workspaceList = useSelector(getForkableWorkspaces);
  const isImportingTemplateToApp = useSelector(
    isImportingTemplateToAppSelector,
  );
  const isImportingTemplate = useSelector(isImportingTemplateSelector);
  const goBack = () => {
    if (handleBackPress) {
      handleBackPress();
    } else {
      history.goBack();
    }
  };
  const onForkModalClose = () => {
    history.replace(`${templateIdUrl({ id: templateId })}`);
  };
  const onForkButtonTrigger = () => {
    if (onClickUseTemplate) {
      onClickUseTemplate(templateId);
    } else {
      history.replace(
        `${templateIdUrl({ id: templateId })}?${SHOW_FORK_MODAL_PARAM}=true`,
      );
    }
  };

  const FORK_BUTTON_TEXT = currentTemplate?.functions.includes(
    TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
  )
    ? FORK_THIS_TEMPLATE_BUILDING_BLOCK
    : FORK_THIS_TEMPLATE;

  return (
    <HeaderWrapper>
      {showBack && (
        <Link
          data-testid="t--template-view-goback"
          onClick={goBack}
          startIcon="arrow-left-line"
        >
          {createMessage(GO_BACK)}
        </Link>
      )}
      <Title kind="heading-l" renderAs="h1">
        {currentTemplate?.title}
      </Title>
      <section>
        {!!workspaceList.length && (
          <ForkTemplate
            onClose={onForkModalClose}
            showForkModal={!!query.get(SHOW_FORK_MODAL_PARAM)}
            templateId={templateId}
          >
            <Button
              className="template-fork-button"
              data-testid="template-fork-button"
              isLoading={
                onClickUseTemplate &&
                (isImportingTemplateToApp || isImportingTemplate)
              }
              onClick={onForkButtonTrigger}
              size="md"
              startIcon="fork-2"
            >
              {createMessage(FORK_BUTTON_TEXT)}
            </Button>
          </ForkTemplate>
        )}
      </section>
    </HeaderWrapper>
  );
}

export default TemplateViewHeader;
