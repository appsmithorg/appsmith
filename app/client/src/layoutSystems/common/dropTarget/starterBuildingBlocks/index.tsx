import React, { useState } from "react";

import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { saveExplorerStatus } from "@appsmith/pages/Editor/Explorer/helpers";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/selectedWorkspaceSelectors";
import {
  importStarterBuildingBlockIntoApplication,
  showTemplatesModal,
} from "actions/templateActions";
import { STARTER_BUILDING_BLOCKS } from "constants/TemplatesConstants";
import { Button, Text } from "design-system";
import LoadingScreen from "pages/Templates/TemplatesModal/LoadingScreen";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getCurrentApplicationId,
} from "selectors/editorSelectors";
import { isImportingStarterBuildingBlockToAppSelector } from "selectors/templatesSelectors";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import {
  IconContainer,
  TemplateLayoutContainer,
  TemplateLayoutContentGrid,
  TemplateLayoutContentItem,
  TemplateLayoutContentItemContent,
  TemplateLayoutFrame,
} from "./StyledComponents";

function StarterBuildingBlocks() {
  const dispatch = useDispatch();
  const [layoutActive, setLayoutActive] = useState<boolean>(false); // manage "or" text and "Drag and Drop Widgets" text
  const [layoutItemActive, setLayoutItemActive] = useState<string>(""); // manage layout item hover
  const [templateSreenshot, setTemplateScreenshot] = useState<string | null>(
    null,
  ); // manage template background screenshot image

  const currentApplication = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId);
  const currentWorkSpace = useSelector(getCurrentAppWorkspace);
  const currentAppMode = useSelector(getAppMode);
  const isImportingStarterBuildingBlockToApp = useSelector(
    isImportingStarterBuildingBlockToAppSelector,
  );

  const handleItemHover = (index: number) => {
    setTemplateScreenshot(layoutItems[index].screenshot);
    setLayoutItemActive(layoutItems[index].title);

    AnalyticsUtil.logEvent("STARTER_BUILDING_BLOCK_HOVER", {
      applicationId: currentApplication?.id,
      workspaceId: currentWorkSpace.id,
      source: "canvas",
      eventData: {
        templateAppName: layoutItems[index].templateName,
      },
    });
  };

  const onClick = (templateId: string, templateName: string) => {
    if (!templateId || !templateName) return;

    // Close explorer tabs to allow datasource prompt show properly
    saveExplorerStatus(applicationId, "widgets", false);
    saveExplorerStatus(applicationId, "queriesAndJs", false);
    saveExplorerStatus(applicationId, "datasource", false);

    dispatch(
      importStarterBuildingBlockIntoApplication(templateId, templateName),
    );

    AnalyticsUtil.logEvent("fork_APPLICATIONTEMPLATE", {
      applicationId: currentApplication?.id,
      workspaceId: currentWorkSpace.id,
      source: "canvas",
      eventData: {
        appMode: currentAppMode,
        application: currentApplication,
        templateAppName: templateName,
      },
    });
  };

  const onSeeMoreClick = () => {
    dispatch(showTemplatesModal({ isOpenFromCanvas: true }));
    AnalyticsUtil.logEvent("STARTER_BUILDING_BLOCK_SEE_MORE_CLICK", {
      applicationId: currentApplication?.id,
      workspaceId: currentWorkSpace.id,
      source: "canvas",
    });
  };

  if (isImportingStarterBuildingBlockToApp) {
    return (
      <TemplateLayoutFrame>
        <LoadingScreen
          text={createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.importLoadingText)}
        />
      </TemplateLayoutFrame>
    );
  }

  return (
    <TemplateLayoutFrame
      data-testid="t--canvas-building-block-frame"
      screenshot={templateSreenshot}
    >
      <TemplateLayoutContainer
        data-testid="t--canvas-building-block-container"
        onMouseEnter={() => setLayoutActive(true)}
        onMouseLeave={() => setLayoutActive(false)}
      >
        <Text
          kind="heading-m"
          style={{
            opacity: layoutActive ? "1" : "0.7",
            color: "var(--colors-semantics-text-emphasis)",
            marginBottom: "16px",
          }}
        >
          {createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.header)}
        </Text>

        <TemplateLayoutContentGrid>
          {layoutItems.map((item, index) => (
            <TemplateLayoutContentItem
              data-testid="t--canvas-building-block-item"
              key={item.id}
              onClick={() =>
                onClick(item.templateId || "", item.templateName || "")
              }
              onMouseEnter={() => handleItemHover(index)}
              onMouseLeave={() => {
                setTemplateScreenshot(null);
                setLayoutItemActive("");
              }}
            >
              <IconContainer layoutItemActive={layoutItemActive === item.title}>
                {item.icon}
              </IconContainer>

              <TemplateLayoutContentItemContent>
                <Text
                  kind={"heading-xs"}
                  style={{
                    color:
                      "var(--colors-ui-content-heading-sub-section-heading)",
                    opacity: layoutActive ? "1" : "0.7",
                    fontWeight: 500,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  kind="body-s"
                  style={{
                    color: "var(--colors-ui-content-supplementary)",
                    opacity: layoutActive ? "1" : "0.7",
                    textAlign: "center",
                  }}
                >
                  {item.description}
                </Text>
              </TemplateLayoutContentItemContent>
            </TemplateLayoutContentItem>
          ))}
        </TemplateLayoutContentGrid>

        <Button
          className="mt-4"
          data-testid="t--canvas-building-block-see-more"
          kind="tertiary"
          onClick={onSeeMoreClick}
          size="md"
        >
          {createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.seeMoreText)}
        </Button>
      </TemplateLayoutContainer>
    </TemplateLayoutFrame>
  );
}

export default StarterBuildingBlocks;

const layoutItems: {
  id: number;
  title: string;
  description: string;
  icon: unknown;
  screenshot: string;
  templateId: string;
  templateName: string;
}[] = STARTER_BUILDING_BLOCKS.STARTER_BUILDING_BLOCKS_TEMPLATES;
