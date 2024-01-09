import type { Template } from "api/TemplatesApi";

// Unit Tests
export const MOCK_BUILDING_BLOCK_TITLE = "Test Building Block";
export const MOCK_BUILDING_BLOCK_DESCRIPTION =
  "Description of the test building block";
export const MOCK_BUILDING_BLOCK_ID = "mockId";

export const mockBuildingBlock: Template = {
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
