import {
  DATASOURCE_GENERATE_PAGE_BUTTON,
  NEW_AI_BUTTON_TEXT,
  NEW_API_BUTTON_TEXT,
  NEW_QUERY_BUTTON_TEXT,
  createMessage,
} from "ee/constants/messages";
import { getNumberOfEntitiesInCurrentPage } from "ee/selectors/entitiesSelector";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PluginType } from "entities/Plugin";
import { DatasourceConnectionMode, type Datasource } from "entities/Datasource";
import { SSLType } from "entities/Datasource/RestAPIForm";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import React from "react";
import { Provider, useSelector } from "react-redux";
import { useParams } from "react-router";
import configureStore from "redux-mock-store";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { DSFormHeader } from "../DataSourceEditor/DSFormHeader";
import DatasourceViewModeSchema from "./DatasourceViewModeSchema";
import GoogleSheetSchema from "./GoogleSheetSchema";
/* eslint-disable @typescript-eslint/no-var-requires */
const reactRouter = require("react-router");

jest.mock("utils/hooks/useFeatureFlag");
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: jest.fn(),
}));
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn(),
}));

const mockStore = configureStore([]);

const mockSetDatasourceViewModeFlag = jest.fn();

const renderBaseDatasourceComponent = () => {
  render(
    <Provider store={mockStore(baseStoreForSpec)}>
      <DatasourceViewModeSchema
        datasource={mockDatasource}
        setDatasourceViewModeFlag={mockSetDatasourceViewModeFlag}
      />
    </Provider>,
  );
};

const renderGoogleSheetDSComponent = () => {
  render(
    <Provider store={mockStore(baseStoreForSpec)}>
      <GoogleSheetSchema datasourceId={mockDatasource.id} />
    </Provider>,
  );
};

const renderDSFormHeader = () => {
  render(
    <Provider store={mockStore(baseStoreForSpec)}>
      <DSFormHeader
        canDeleteDatasource
        canManageDatasource
        datasource={mockDatasource}
        datasourceId={mockDatasource.id}
        isDeleting={false}
        isNewDatasource={false}
        isPluginAuthorized
        pluginImage=""
        pluginName=""
        pluginType={PluginType.DB}
        setDatasourceViewMode={() => true}
        viewMode
      />
    </Provider>,
  );
};

const getCreateButtonText = (pluginType: PluginType) => {
  switch (pluginType) {
    case PluginType.DB:
    case PluginType.SAAS:
      return createMessage(NEW_QUERY_BUTTON_TEXT);
    case PluginType.AI:
      return createMessage(NEW_AI_BUTTON_TEXT);
    default:
      return createMessage(NEW_API_BUTTON_TEXT);
  }
};

describe("DatasourceViewModeSchema Component", () => {
  it("1. should not render the 'generate page' button when release_drag_drop_building_blocks_enabled is enabled", () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (useParams as jest.Mock).mockReturnValue({
      pageId: unitTestBaseMockStore.entities.pageList.currentPageId,
    });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getNumberOfEntitiesInCurrentPage) {
        return 0;
      }

      return selector(baseStoreForSpec); // Default case for other selectors
    });
    renderBaseDatasourceComponent();

    // Check that the "generate page" button is not rendered
    const generatePageButton = screen.queryByText(
      createMessage(DATASOURCE_GENERATE_PAGE_BUTTON),
    );

    expect(generatePageButton).not.toBeInTheDocument();
  });

  it("2. should render new query button as primary when release_drag_drop_building_blocks_enabled is enabled", () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    const mockHistoryPush = jest.fn();
    const mockHistoryReplace = jest.fn();
    const mockHistoryLocation = {
      pathname: "/",
      search: "",
      hash: "",
      state: {},
    };

    jest.spyOn(reactRouter, "useHistory").mockReturnValue({
      push: mockHistoryPush,
      replace: mockHistoryReplace,
      location: mockHistoryLocation,
    });

    jest.spyOn(reactRouter, "useLocation").mockReturnValue(mockHistoryLocation);

    renderDSFormHeader();

    // Check that the "New Query" button is rendered as primary
    const newQuerySpan = screen.getByText(getCreateButtonText(PluginType.DB));
    const newQueryButton = newQuerySpan.closest("button");

    expect(newQueryButton).toHaveAttribute("kind", "primary");
  });
});

describe("GoogleSheetSchema Component", () => {
  it("1. should not render the 'generate page' button when release_drag_drop_building_blocks_enabled is enabled", () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    (useParams as jest.Mock).mockReturnValue({
      pageId: unitTestBaseMockStore.entities.pageList.currentPageId,
    });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getNumberOfEntitiesInCurrentPage) {
        return 0;
      }

      return selector(baseStoreForSpec); // Default case for other selectors
    });
    renderGoogleSheetDSComponent();

    // Check that the "generate page" button is not rendered
    const generatePageButton = screen.queryByText(
      createMessage(DATASOURCE_GENERATE_PAGE_BUTTON),
    );

    expect(generatePageButton).not.toBeInTheDocument();
  });
});

describe("DSFormHeader Component", () => {
  it("1. should not render the 'generate page' button when release_drag_drop_building_blocks_enabled is enabled", () => {
    (useFeatureFlag as jest.Mock).mockReturnValue(true);
    const mockHistoryPush = jest.fn();
    const mockHistoryReplace = jest.fn();
    const mockHistoryLocation = {
      pathname: "/",
      search: "",
      hash: "",
      state: {},
    };

    jest.spyOn(reactRouter, "useHistory").mockReturnValue({
      push: mockHistoryPush,
      replace: mockHistoryReplace,
      location: mockHistoryLocation,
    });

    jest.spyOn(reactRouter, "useLocation").mockReturnValue(mockHistoryLocation);

    renderDSFormHeader();

    // Check that the "generate page" button is not rendered
    const generatePageButton = screen.queryByText(
      createMessage(DATASOURCE_GENERATE_PAGE_BUTTON),
    );

    expect(generatePageButton).not.toBeInTheDocument();
  });
});

const mockDatasource: Datasource = {
  id: "667941878b418b52eb273895",
  userPermissions: [
    "execute:datasources",
    "delete:datasources",
    "manage:datasources",
    "read:datasources",
  ],
  name: "Users",
  pluginId: "656eeb1024ec7f5154c9ba00",
  workspaceId: "6679402f8b418b52eb27388d",
  datasourceStorages: {
    unused_env: {
      datasourceId: "667941878b418b52eb273895",
      environmentId: "unused_env",
      datasourceConfiguration: {
        url: "",
        connection: {
          mode: DatasourceConnectionMode.READ_WRITE,
          ssl: {
            authType: SSLType.DEFAULT,
            authTypeControl: false,
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            certificateFile: {} as any,
          },
        },
        authentication: {
          authenticationType: "dbAuth",
          username: "users",
        },
      },
      isConfigured: true,
      isValid: true,
    },
  },
  invalids: [],
  messages: [],
  isMock: true,
};

const baseStoreForSpec = {
  entities: {
    ...unitTestBaseMockStore.entities,
    plugins: {
      list: [
        {
          id: "656eeb1024ec7f5154c9ba00",
          userPermissions: [],
          name: "PostgreSQL",
          type: "DB",
          packageName: "postgres-plugin",
          iconLocation: "https://assets.appsmith.com/logo/postgresql.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-postgres#create-crud-queries",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "PostgreSQL",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            CREATE:
              "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  );",
            SELECT:
              "SELECT * FROM <<your_table_name>> LIMIT 10;\n\n-- Please enter a valid table name and hit RUN",
            UPDATE:
              "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = {{ usersTable.selectedRow.id }};\n",
            DELETE: "DELETE FROM users WHERE id = -1;",
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "656eeb1024ec7f5154c9ba01",
          userPermissions: [],
          name: "REST API",
          type: "API",
          packageName: "restapi-plugin",
          iconLocation: "https://assets.appsmith.com/RestAPI.png",
          uiComponent: "ApiEditorForm",
          datasourceComponent: "RestAPIDatasourceForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
      ],
    },
    datasources: {
      list: [
        {
          id: "667941878b418b52eb273895",
          userPermissions: [
            "execute:datasources",
            "delete:datasources",
            "manage:datasources",
            "read:datasources",
          ],
          name: "Users",
          pluginId: "656eeb1024ec7f5154c9ba00",
          workspaceId: "6679402f8b418b52eb27388d",
          datasourceStorages: {
            unused_env: {
              id: "667941878b418b52eb273896",
              datasourceId: "667941878b418b52eb273895",
              environmentId: "unused_env",
              datasourceConfiguration: {
                connection: {
                  mode: "READ_WRITE",
                  ssl: {
                    authType: "DEFAULT",
                  },
                },
                endpoints: [
                  {
                    host: "mockdb.internal.appsmith.com",
                  },
                ],
                authentication: {
                  authenticationType: "dbAuth",
                  username: "users",
                  databaseName: "users",
                },
              },
              isConfigured: true,
              invalids: [],
              messages: [],
              isValid: true,
            },
          },
          invalids: [],
          messages: [],
          isRecentlyCreated: true,
          isMock: true,
          isValid: true,
          new: false,
        },
      ],
      loading: false,
      isTesting: false,
      isListing: false,
      fetchingDatasourceStructure: {
        "66793e2a8b418b52eb27388a": false,
        "667941878b418b52eb273895": false,
      },
      structure: {
        "66793e2a8b418b52eb27388a": {
          tables: [
            {
              type: "TABLE",
              schema: "public",
              name: "public.users",
              columns: [
                {
                  name: "id",
                  type: "int4",
                  defaultValue: "nextval('users_id_seq'::regclass)",
                  isAutogenerated: true,
                },
                {
                  name: "gender",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "latitude",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "longitude",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "dob",
                  type: "timestamptz",
                  isAutogenerated: false,
                },
                {
                  name: "phone",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "email",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "image",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "country",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "name",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "created_at",
                  type: "timestamp",
                  isAutogenerated: false,
                },
                {
                  name: "updated_at",
                  type: "timestamp",
                  isAutogenerated: false,
                },
              ],
              keys: [
                {
                  name: "users_pkey",
                  columnNames: ["id"],
                  type: "primary key",
                },
              ],
              templates: [
                {
                  title: "SELECT",
                  body: 'SELECT * FROM public."users" LIMIT 10;',
                  suggested: true,
                },
                {
                  title: "INSERT",
                  body: 'INSERT INTO public."users" ("gender", "latitude", "longitude", "dob", "phone", "email", "image", "country", "name", "created_at", "updated_at")\n  VALUES (\'\', \'\', \'\', TIMESTAMP WITH TIME ZONE \'2019-07-01 06:30:00 CET\', \'\', \'\', \'\', \'\', \'\', TIMESTAMP \'2019-07-01 10:00:00\', TIMESTAMP \'2019-07-01 10:00:00\');',
                  suggested: false,
                },
                {
                  title: "UPDATE",
                  body: 'UPDATE public."users" SET\n    "gender" = \'\',\n    "latitude" = \'\',\n    "longitude" = \'\',\n    "dob" = TIMESTAMP WITH TIME ZONE \'2019-07-01 06:30:00 CET\',\n    "phone" = \'\',\n    "email" = \'\',\n    "image" = \'\',\n    "country" = \'\',\n    "name" = \'\',\n    "created_at" = TIMESTAMP \'2019-07-01 10:00:00\',\n    "updated_at" = TIMESTAMP \'2019-07-01 10:00:00\'\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!',
                  suggested: false,
                },
                {
                  title: "DELETE",
                  body: 'DELETE FROM public."users"\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!',
                  suggested: false,
                },
              ],
            },
          ],
        },
        "667941878b418b52eb273895": {
          tables: [
            {
              type: "TABLE",
              schema: "public",
              name: "public.users",
              columns: [
                {
                  name: "id",
                  type: "int4",
                  defaultValue: "nextval('users_id_seq'::regclass)",
                  isAutogenerated: true,
                },
                {
                  name: "gender",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "latitude",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "longitude",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "dob",
                  type: "timestamptz",
                  isAutogenerated: false,
                },
                {
                  name: "phone",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "email",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "image",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "country",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "name",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "created_at",
                  type: "timestamp",
                  isAutogenerated: false,
                },
                {
                  name: "updated_at",
                  type: "timestamp",
                  isAutogenerated: false,
                },
              ],
              keys: [
                {
                  name: "users_pkey",
                  columnNames: ["id"],
                  type: "primary key",
                },
              ],
              templates: [
                {
                  title: "SELECT",
                  body: 'SELECT * FROM public."users" LIMIT 10;',
                  suggested: true,
                },
                {
                  title: "INSERT",
                  body: 'INSERT INTO public."users" ("gender", "latitude", "longitude", "dob", "phone", "email", "image", "country", "name", "created_at", "updated_at")\n  VALUES (\'\', \'\', \'\', TIMESTAMP WITH TIME ZONE \'2019-07-01 06:30:00 CET\', \'\', \'\', \'\', \'\', \'\', TIMESTAMP \'2019-07-01 10:00:00\', TIMESTAMP \'2019-07-01 10:00:00\');',
                  suggested: false,
                },
                {
                  title: "UPDATE",
                  body: 'UPDATE public."users" SET\n    "gender" = \'\',\n    "latitude" = \'\',\n    "longitude" = \'\',\n    "dob" = TIMESTAMP WITH TIME ZONE \'2019-07-01 06:30:00 CET\',\n    "phone" = \'\',\n    "email" = \'\',\n    "image" = \'\',\n    "country" = \'\',\n    "name" = \'\',\n    "created_at" = TIMESTAMP \'2019-07-01 10:00:00\',\n    "updated_at" = TIMESTAMP \'2019-07-01 10:00:00\'\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!',
                  suggested: false,
                },
                {
                  title: "DELETE",
                  body: 'DELETE FROM public."users"\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!',
                  suggested: false,
                },
              ],
            },
          ],
        },
      },
      isFetchingMockDataSource: false,
      mockDatasourceList: [
        {
          pluginType: "db",
          packageName: "mongo-plugin",
          description: "This contains a standard movies collection",
          name: "Movies",
        },
        {
          pluginType: "db",
          packageName: "postgres-plugin",
          description: "This contains a standard users information",
          name: "Users",
        },
      ],
      executingDatasourceQuery: false,
      isReconnectingModalOpen: false,
      unconfiguredList: [],
      isDatasourceBeingSaved: false,
      isDatasourceBeingSavedFromPopup: false,
      gsheetToken: "",
      gsheetProjectID: "",
      gsheetStructure: {
        spreadsheets: {},
        sheets: {},
        columns: {},
        isFetchingSpreadsheets: false,
        isFetchingSheets: false,
        isFetchingColumns: false,
      },
      recentDatasources: [],
      isDeleting: false,
    },
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    datasourcePane: {
      selectedTableName: "users",
    },
    datasourceName: {
      isSaving: [mockDatasource.id],
      errors: [mockDatasource.id],
    },
  },
  environments: {
    currentEnvironmentDetails: {
      id: "unused_env",
      name: "",
    },
  },
};
