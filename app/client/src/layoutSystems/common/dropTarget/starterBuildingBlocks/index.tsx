import React, { useState } from "react";

import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { saveExplorerStatus } from "@appsmith/pages/Editor/Explorer/helpers";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { importStarterBuildingBlockIntoApplication } from "actions/templateActions";
import {
  STARTER_BUILDING_BLOCKS,
  STARTER_BUILDING_BLOCK_TEMPLATE_NAME,
} from "constants/TemplatesConstants";
import LoadingScreen from "pages/Templates/TemplatesModal/LoadingScreen";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplication,
  getCurrentApplicationId,
} from "selectors/editorSelectors";
import { isImportingStarterBuildingBlockToAppSelector } from "selectors/templatesSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  IconContainer,
  TemplateLayoutContainer,
  TemplateLayoutContentGrid,
  TemplateLayoutContentItem,
  TemplateLayoutContentItemContent,
  TemplateLayoutDragAndDropText,
  TemplateLayoutFrame,
  TemplateLayoutHeaderText,
  TemplateLayoutOrText,
  TemplateLayoutRowItemDescription,
  TemplateLayoutRowItemTitle,
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

  const onClick = (
    templateId: string,
    templateName: string,
    templatePageName: string,
  ) => {
    if (!templateId || !templateName || !templatePageName) return;

    // Close explorer tabs to allow datasource prompt show properly
    saveExplorerStatus(applicationId, "widgets", false);
    saveExplorerStatus(applicationId, "queriesAndJs", false);
    saveExplorerStatus(applicationId, "datasource", false);

    dispatch(
      importStarterBuildingBlockIntoApplication(
        templateId,
        templateName,
        templatePageName,
      ),
    );

    AnalyticsUtil.logEvent("fork_APLICATIONTEMPLATE", {
      applicationId: currentApplication?.id,
      workspaceId: currentWorkSpace.id,
      source: "canvas",
      eventData: {
        appMode: currentAppMode,
        application: currentApplication,
        templateAppName: STARTER_BUILDING_BLOCK_TEMPLATE_NAME,
        templatePageName,
      },
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
    <TemplateLayoutFrame screenshot={templateSreenshot}>
      <TemplateLayoutContainer
        onMouseEnter={() => setLayoutActive(true)}
        onMouseLeave={() => setLayoutActive(false)}
      >
        <TemplateLayoutHeaderText layoutActive={layoutActive}>
          {createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.header)}
        </TemplateLayoutHeaderText>

        <TemplateLayoutContentGrid>
          {layoutItems.map((item, index) => (
            <TemplateLayoutContentItem
              key={item.id}
              onClick={() =>
                onClick(
                  item.templateId || "",
                  item.templateName || "",
                  item.templatePageName || "",
                )
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
                <TemplateLayoutRowItemTitle layoutActive={layoutActive}>
                  {item.title}
                </TemplateLayoutRowItemTitle>
                <TemplateLayoutRowItemDescription layoutActive={layoutActive}>
                  {item.description}
                </TemplateLayoutRowItemDescription>
              </TemplateLayoutContentItemContent>
            </TemplateLayoutContentItem>
          ))}
        </TemplateLayoutContentGrid>
      </TemplateLayoutContainer>

      <TemplateLayoutOrText layoutActive={layoutActive}>
        {createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.or)}
      </TemplateLayoutOrText>

      <TemplateLayoutDragAndDropText layoutActive={layoutActive}>
        {createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.dragAndDrop)}
      </TemplateLayoutDragAndDropText>
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
  templatePageName: string;
}[] = STARTER_BUILDING_BLOCKS.STARTER_BUILDING_BLOCKS_TEMPLATES;
