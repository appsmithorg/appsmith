import {
  FORK_THIS_TEMPLATE,
  GO_BACK,
  createMessage,
} from "@appsmith/constants/messages";
import { templateIdUrl } from "RouteBuilder";
import { Button, Link, Text } from "design-system";
import { useQuery } from "pages/Editor/utils";
import React from "react";
import { useSelector } from "react-redux";
import { getActiveTemplateSelector } from "selectors/templatesSelectors";
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

type Props = {
  templateId: string;
};
const SHOW_FORK_MODAL_PARAM = "showForkTemplateModal";

function TemplateViewHeader({ templateId }: Props) {
  const currentTemplate = useSelector(getActiveTemplateSelector);
  const query = useQuery();
  const goBack = () => {
    history.goBack();
  };
  const onForkModalClose = () => {
    history.replace(`${templateIdUrl({ id: templateId })}`);
  };
  const onForkButtonTrigger = () => {
    history.replace(
      `${templateIdUrl({ id: templateId })}?${SHOW_FORK_MODAL_PARAM}=true`,
    );
  };
  return (
    <HeaderWrapper>
      <Link onClick={goBack} startIcon="arrow-left-line">
        {createMessage(GO_BACK)}
      </Link>
      <Title kind="heading-l" renderAs="h1">
        {currentTemplate?.title}
      </Title>
      <ForkTemplate
        onClose={onForkModalClose}
        showForkModal={!!query.get(SHOW_FORK_MODAL_PARAM)}
        templateId={templateId}
      >
        <Button
          className="template-fork-button"
          data-testid="template-fork-button"
          onClick={onForkButtonTrigger}
          size="md"
          startIcon="fork-2"
        >
          {createMessage(FORK_THIS_TEMPLATE)}
        </Button>
      </ForkTemplate>
    </HeaderWrapper>
  );
}

export default TemplateViewHeader;
