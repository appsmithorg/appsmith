import {
  FORK_THIS_TEMPLATE,
  GO_BACK,
  createMessage,
} from "@appsmith/constants/messages";
import { templateIdUrl } from "@appsmith/RouteBuilder";
import { Button, Link, Text } from "design-system";
import { useQuery } from "pages/Editor/utils";
import React from "react";
import { useSelector } from "react-redux";
import {
  getActiveTemplateSelector,
  getForkableWorkspaces,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import history from "utils/history";
import ForkTemplate from "./ForkTemplate";

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
  templateId: string;
  onClickUseTemplate?: (id: string) => void;
  showBack: boolean;
}
const SHOW_FORK_MODAL_PARAM = "showForkTemplateModal";

function TemplateViewHeader({
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
  const goBack = () => {
    history.goBack();
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
              isLoading={onClickUseTemplate && isImportingTemplateToApp}
              onClick={onForkButtonTrigger}
              size="md"
              startIcon="fork-2"
            >
              {createMessage(FORK_THIS_TEMPLATE)}
            </Button>
          </ForkTemplate>
        )}
      </section>
    </HeaderWrapper>
  );
}

export default TemplateViewHeader;
