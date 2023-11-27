import React from "react";
import {
  STARTER_TEMPLATE_PAGE_LAYOUTS as STARTER_BUILDING_BLOCKS_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { importSvg } from "@design-system/widgets-old/src/utils/icon-loadables";

export const COMMUNITY_PORTAL = {
  BASE_URL: "https://community.appsmith.com",
};

const RecordEdit = importSvg(
  async () =>
    import("../assets/icons/templates/starter-template-record-edit.svg"),
);
const RecordDetails = importSvg(
  async () =>
    import("../assets/icons/templates/starter-template-record-details.svg"),
);
const Dashboard = importSvg(
  async () =>
    import("../assets/icons/templates/starter-template-dashboard.svg"),
);

export const STARTER_BUILDING_BLOCK_TEMPLATE_NAME = "Starter Building Block";

export const STARTER_BUILDING_BLOCKS = {
  DATASOURCE_PROMPT_DELAY: 3000,
  STARTER_BUILDING_BLOCKS_TEMPLATES: [
    {
      id: 2,
      title: createMessage(
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.recordDetails.name,
      ),
      description: createMessage(
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.recordDetails.description,
      ),
      icon: <RecordDetails />,
      screenshot:
        "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-record-detail.png",
      templateId: "6530e343fa63b553e4be0266",
      templateName: STARTER_BUILDING_BLOCK_TEMPLATE_NAME,
      templatePageName: "Record Details",
    },
    {
      id: 1,
      title: createMessage(
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.recordEdit.name,
      ),
      description: createMessage(
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.recordEdit.description,
      ),
      icon: <RecordEdit />,
      screenshot:
        "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-record-edit.png",
      templateId: "6530e343fa63b553e4be0266",
      templateName: STARTER_BUILDING_BLOCK_TEMPLATE_NAME,
      templatePageName: "Record Edit",
    },
    {
      id: 3,
      title: createMessage(
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.dashboard.name,
      ),
      description: createMessage(
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.dashboard.description,
      ),
      icon: <Dashboard />,
      screenshot:
        "https://s3.us-east-2.amazonaws.com/template.appsmith.com/canvas-starter-page-layout-dashboard.png",
      templateId: "6530e343fa63b553e4be0266",
      templateName: STARTER_BUILDING_BLOCK_TEMPLATE_NAME,
      templatePageName: "Dashboard",
    },
  ],
};
