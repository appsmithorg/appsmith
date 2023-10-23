import React, { useState } from "react";

import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { importSvg } from "@design-system/widgets-old/src/utils/icon-loadables";
import { importStarterTemplateIntoApplication } from "actions/templateActions";
import LoadingScreen from "pages/Templates/TemplatesModal/LoadingScreen";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplication } from "selectors/editorSelectors";
import { isImportingStarterTemplateToAppSelector } from "selectors/templatesSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
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

const STARTER_TEMPLATE_NAME = "Starter template";

function CanvasStarterTemplatesLayout() {
  const dispatch = useDispatch();
  const [layoutActive, setLayoutActive] = useState<boolean>(false); // manage "or" text and "Drag and Drop Widgets" text
  const [templateSreenshot, setTemplateScreenshot] = useState<string | null>(
    null,
  ); // manage template background screenshot image
  const currentApplication = useSelector(getCurrentApplication);
  const currentWorkSpace = useSelector(getCurrentAppWorkspace);
  const currentAppMode = useSelector(getAppMode);
  const isImportingStarterTemplateToApp = useSelector(
    isImportingStarterTemplateToAppSelector,
  );

  const handleItemHover = (index: number) => {
    setTemplateScreenshot(layoutItems[index].screenshot);
  };

  const onClick = (
    templateId: string,
    templateName: string,
    templatePageName: string,
  ) => {
    if (!templateId || !templateName || !templatePageName) return;

    dispatch(
      importStarterTemplateIntoApplication(
        templateId,
        templateName,
        templatePageName,
      ),
    );

    AnalyticsUtil.logEvent("FORK_APLICATIONTEMPLATE", {
      applicationId: currentApplication?.id,
      workspaceId: currentWorkSpace.id,
      templateAppName: STARTER_TEMPLATE_NAME,
      source: "canvas",
      eventData: {
        appMode: currentAppMode,
        application: currentApplication,
      },
    });
  };

  if (isImportingStarterTemplateToApp) {
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
          Choose a Page Layout
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
              onMouseLeave={() => setTemplateScreenshot(null)}
            >
              {item.icon}

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
        or
      </TemplateLayoutOrText>

      <TemplateLayoutDragAndDropText layoutActive={layoutActive}>
        Drag and Drop Widgets
      </TemplateLayoutDragAndDropText>
    </TemplateLayoutFrame>
  );
}

export default CanvasStarterTemplatesLayout;

const RecordEdit = importSvg(
  async () =>
    import(
      "../../../../assets/icons/templates/starter-template-record-edit.svg"
    ),
);
const RecordDetails = importSvg(
  async () =>
    import(
      "../../../../assets/icons/templates/starter-template-record-details.svg"
    ),
);
const Dashboard = importSvg(
  async () =>
    import("../../../../assets/icons/templates/starter-template-dashboard.svg"),
);

const layoutItems: {
  id: number;
  title: string;
  description: string;
  icon: unknown;
  screenshot: string;
  templateId: string;
  templateName: string;
  templatePageName: string;
}[] = [
  {
    id: 1,
    title: createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.recordEdit.name),
    description: createMessage(
      STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.recordEdit.description,
    ),
    icon: <RecordEdit />,
    screenshot:
      "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-record-edit.png",
    templateId: "62221f5300c64549b31b9466",
    templateName: STARTER_TEMPLATE_NAME,
    templatePageName: "1 Track Applications",
  },
  {
    id: 2,
    title: createMessage(
      STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.recordDetails.name,
    ),
    description: createMessage(
      STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.recordDetails.description,
    ),
    icon: <RecordDetails />,
    screenshot:
      "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-record-detail.png",
    templateId: "62221f5300c64549b31b9466",
    templateName: STARTER_TEMPLATE_NAME,
    templatePageName: "2 Application Upload2 Application Upload",
  },
  {
    id: 3,
    title: createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.dashboard.name),
    description: createMessage(
      STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.dashboard.description,
    ),
    icon: <Dashboard />,
    screenshot:
      "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-dashboard.png",
    templateId: "6318ccfd7e9aa41f2e0db691",
    templateName: STARTER_TEMPLATE_NAME,
    templatePageName: "Dashboard",
  },
];
