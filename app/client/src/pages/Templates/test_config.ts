import type { Template } from "api/TemplatesApi";

// Unit Tests
export const MOCK_BUILDING_BLOCK_TITLE = "Test Building Block";
export const MOCK_BUILDING_BLOCK_DESCRIPTION =
  "Description of the test building block";
export const MOCK_BUILDING_BLOCK_ID = "mockId";

export const unitTestMockBuildingBlock: Template = {
  id: MOCK_BUILDING_BLOCK_ID,
  userPermissions: ["read", "write"],
  title: MOCK_BUILDING_BLOCK_TITLE,
  description: MOCK_BUILDING_BLOCK_DESCRIPTION,
  appUrl: "https://mockapp.com",
  gifUrl: "https://mockapp.com/mock.gif",
  screenshotUrls: [
    "https://mockapp.com/screenshot1.jpg",
    "https://mockapp.com/screenshot2.jpg",
  ],
  widgets: [],
  functions: ["Function1", "Function2"],
  useCases: ["UseCase1", "UseCase2"],
  datasources: ["Datasource1", "Datasource2"],
  pages: [],
  allowPageImport: true,
};

export const unitTestMockTemplate = {
  id: "6222224900c64549b31b9467",
  userPermissions: [],
  title: "Fund Raising CRM",
  description:
    "This Fundraising CRM, allows for secure and direct communication between a company, and their investors, allowing users to maintain track of their communications.",
  appUrl:
    "https://app.appsmith.com/applications/61dbc9d66bd5757f166cc898/pages/6204a671552a5f63958772aa/b?embed=true",
  appDataUrl:
    "https://s3.us-east-2.amazonaws.com/template.appsmith.com/FundRaisingCRM_Enabled.json",
  gifUrl: "",
  sortPriority: "1001",
  screenshotUrls: [
    "https://assets.appsmith.com/templates/screenshots/FundRaisingCRM.png",
  ],
  widgets: [
    "BUTTON_WIDGET",
    "CONTAINER_WIDGET",
    "FILE_PICKER_WIDGET_V2",
    "FORM_WIDGET",
    "ICON_BUTTON_WIDGET",
    "INPUT_WIDGET_V2",
    "LIST_WIDGET_V2",
    "MAP_WIDGET",
    "MODAL_WIDGET",
    "RATE_WIDGET",
    "RICH_TEXT_EDITOR_WIDGET",
    "TEXT_WIDGET",
  ],
  functions: ["Operations", "Communications", "All"],
  useCases: ["Finance", "Information Technology (IT)"],
  datasources: ["amazons3-plugin", "google-sheets-plugin"],
  pages: [
    {
      id: "6204a671552a5f63958772aa",
      name: "Investors",
      slug: "investors",
      isDefault: true,
      isHidden: false,
    },
  ],
  minVersion: "v1.6.11-SNAPSHOT",
  minVersionPadded: "000010000600011",
  downloadCount: 0,
  active: true,
  allowPageImport: true,
  isCommunityTemplate: false,
  new: false,
};
