import type { Template } from "api/TemplatesApi";

// These will be eventually from an api
export const functions = [
  {
    label: "Technology",
  },
  { label: "Health Care" },
  { label: "Financials" },
  { label: "Consumer Discretionary" },
  { label: "Communication Services" },
  { label: "Industrials" },
  { label: "Consumer goods" },
  { label: "Energy" },
  { label: "Utilities" },
  { label: "Real Estate" },
  { label: "Materials" },
  { label: "Agriculture" },
  { label: "Services" },
  { label: "Other" },
  { label: "E-Commerce" },
  { label: "Start-up" },
  { label: "textile" },
];
export const useCases = [
  { label: "Support" },
  { label: "Marketing" },
  { label: "Sales" },
  { label: "Finance" },
  { label: "Information Technology (IT)" },
  { label: "Human Resources (HR)" },
  { label: "Communications" },
  { label: "Legal" },
  { label: "Public Relations (PR)" },
  { label: "Product, design, and UX" },
  { label: "Project Management" },
  { label: "Personal" },
  { label: "Remote work" },
  { label: "Software Development" },
];

export const TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE = "Building Blocks";
export const TEMPLATE_ALL_FILTER_FUNCTION_VALUE = "All";
export const BUILDING_BLOCK_THUMBNAIL_ALT_TEXT = "Building Block Thumbnail";

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
