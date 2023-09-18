export * from "ce/pages/Editor/KnowledgeBase/KBEditorNavButton";

import React from "react";
import { Button, Link, Text, Tooltip } from "design-system";
import styled from "styled-components";
import { viewerURL } from "RouteBuilder";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { useHref } from "pages/Editor/utils";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";

const StyledLink = styled(Link)`
  & > * {
    font-size: 12px !important;
  }
`;

export const KBEditorNavButton = () => {
  const pageId = useSelector(getCurrentPageId) as string;
  const deployLink = useHref(viewerURL, { pageId });

  const isKBFeatureEnabled = useSelector((state) =>
    selectFeatureFlagCheck(state, "release_knowledge_base_enabled"),
  );

  if (!isKBFeatureEnabled) return null;

  const TooltipContent = (
    <Text color="white" kind="body-s">
      You can generate a knowledge base only for your deployed application. Go
      to your{" "}
      <StyledLink className="!inline-flex" kind="primary" to={deployLink}>
        current deployed version
      </StyledLink>{" "}
      and access this feature.
    </Text>
  );

  return (
    <Tooltip content={TooltipContent} trigger="click">
      <Button kind="tertiary" size="md" startIcon="book-line">
        Knowledge Base
      </Button>
    </Tooltip>
  );
};
