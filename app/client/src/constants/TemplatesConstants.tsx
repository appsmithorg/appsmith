import React from "react";
import {
  STARTER_TEMPLATE_PAGE_LAYOUTS as STARTER_BUILDING_BLOCKS_LAYOUTS,
  createMessage,
} from "@appsmith/constants/messages";
import { importSvg } from "@design-system/widgets-old/src/utils/icon-loadables";
import { TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE } from "pages/Templates/constants";

export const COMMUNITY_PORTAL = {
  BASE_URL: "https://community.appsmith.com",
};

const RecordEdit = importSvg(
  async () =>
    import("../assets/icons/templates/canvas-starter-record-edit.svg"),
);
const RecordDetails = importSvg(
  async () =>
    import("../assets/icons/templates/canvas-starter-record-details.svg"),
);
const SortFilterTable = importSvg(
  async () =>
    import("../assets/icons/templates/canvas-starter-sort-filter-table.svg"),
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
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.sortFilterTable.name,
      ),
      description: createMessage(
        STARTER_BUILDING_BLOCKS_LAYOUTS.layouts.sortFilterTable.description,
      ),
      icon: <SortFilterTable />,
      screenshot:
        "https://images.ctfassets.net/lpvian6u6i39/55ERsTeUvbAzJVaBBsInZr/0009fee0adb710b91c18a5bdc989deeb/canvas-starter-building-block-sort-filter-table.png?fm=png&q=50",
      templateId: "6530e343fa63b553e4be0266",
      templateName: STARTER_BUILDING_BLOCK_TEMPLATE_NAME,
      templatePageName: "Sort and Filter Table",
    },
  ],
};

export const CANVAS_STARTER_TEMPLATES_SEE_MORE_BUILDING_BLOCKS_PRE_FILTER = {
  functions: [TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE],
};
