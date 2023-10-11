import React, { useState } from "react";

import {
  STARTER_TEMPLATE_PAGE_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import {
  TemplateLayoutFrame,
  TemplateLayoutContainer,
  TemplateLayoutHeaderText,
  TemplateLayoutContentGrid,
  TemplateLayoutContentItem,
  TemplateLayoutContentItemContent,
  TemplateLayoutRowItemTitle,
  TemplateLayoutDragAndDropText,
  TemplateLayoutOrText,
  TemplateLayoutRowItemDescription,
} from "./StyledComponents";
import { importSvg } from "design-system-old";

function CanvasStarterTemplatesLayout() {
  const [layoutActive, setLayoutActive] = useState<boolean>(true); // manage "or" text and "Drag and Drop Widgets" text
  const [templateSreenshot, setTemplateScreenshot] = useState<string | null>(
    null,
  ); // manage template background screenshot immage

  const handleItemHover = (index: number) => {
    setTemplateScreenshot(layoutItems[index].screenshot);
  };

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
const Form = importSvg(
  async () =>
    import("../../../../assets/icons/templates/starter-template-form.svg"),
);

const layoutItems = [
  {
    id: 1,
    title: createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.recordEdit.name),
    description: createMessage(
      STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.recordEdit.description,
    ),
    icon: <RecordEdit />,
    screenshot:
      "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-record-edit.png",
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
  },
  {
    id: 4,
    title: createMessage(STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.form.name),
    description: createMessage(
      STARTER_TEMPLATE_PAGE_LAYOUTS.layouts.form.description,
    ),
    icon: <Form />,
    screenshot:
      "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-form.png",
  },
];
