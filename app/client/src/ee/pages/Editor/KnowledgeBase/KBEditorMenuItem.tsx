export * from "ce/pages/Editor/KnowledgeBase/KBEditorMenuItem";

import React from "react";
import { MenuItem } from "design-system";
import { viewerURL } from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { useHref } from "pages/Editor/utils";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";

export const KBEditorMenuItem = () => {
  const pageId = useSelector(getCurrentPageId) as string;
  const deployLink = useHref(viewerURL, { pageId, params: { showKb: true } });

  const isKBFeatureEnabled = useSelector((state) =>
    selectFeatureFlagCheck(state, "release_knowledge_base_enabled"),
  );

  const goToDeployedVersion = () => {
    window.open(deployLink, "_blank")?.focus();
  };

  if (!isKBFeatureEnabled) return null;

  return (
    <MenuItem
      className="t--generate-kb-btn"
      onClick={goToDeployedVersion}
      startIcon="book-line"
    >
      Generate knowledge base
    </MenuItem>
  );
};
