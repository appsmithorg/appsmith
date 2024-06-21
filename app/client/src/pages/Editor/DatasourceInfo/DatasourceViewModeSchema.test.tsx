import React from "react";
import { render, screen } from "@testing-library/react";
import configureStore from "redux-mock-store";
import { Provider, useSelector } from "react-redux";
import "@testing-library/jest-dom";
import DatasourceViewModeSchema from "./DatasourceViewModeSchema";
import {
  DATASOURCE_GENERATE_PAGE_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import { unitTestBaseMockStore } from "layoutSystems/common/dropTarget/unitTestUtils";
import { DatasourceConnectionMode, type Datasource } from "entities/Datasource";
import { SSLType } from "entities/Datasource/RestAPIForm";
import { useParams } from "react-router";
import { getNumberOfEntitiesInCurrentPage } from "@appsmith/selectors/entitiesSelector";

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

const mockDatasource: Datasource = {
  id: "667552bd8b418b52eb273853",
  userPermissions: [
    "execute:datasources",
    "delete:datasources",
    "manage:datasources",
    "read:datasources",
  ],
  name: "Users",
  pluginId: "656eeb1024ec7f5154c9ba00",
  workspaceId: "66753f078b418b52eb2737bd",
  datasourceStorages: {
    unused_env: {
      datasourceId: "667552bd8b418b52eb273853",
      environmentId: "unused_env",
      datasourceConfiguration: {
        url: "",
        connection: {
          mode: DatasourceConnectionMode.READ_WRITE,
          ssl: {
            authType: SSLType.DEFAULT,
            authTypeControl: false,
            certificateFile: {
              name: "",
              base64Content: "",
            },
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
const mockSetDatasourceViewModeFlag = jest.fn();

const renderComponent = (store = baseStoreForSpec) => {
  render(
    <Provider store={mockStore(store)}>
      <DatasourceViewModeSchema
        datasource={mockDatasource}
        setDatasourceViewModeFlag={mockSetDatasourceViewModeFlag}
      />
    </Provider>,
  );
};

describe("DatasourceViewModeSchema Component", () => {
  it("should not render the 'generate page' button when release_drag_drop_building_blocks_enabled is enabled", () => {
    (useParams as jest.Mock).mockReturnValue({
      pageId: unitTestBaseMockStore.entities.pageList.currentPageId,
    });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getNumberOfEntitiesInCurrentPage) {
        return 0;
      }
      return selector(baseStoreForSpec); // Default case for other selectors
    });
    renderComponent();

    // Check that the "generate page" button is not rendered
    const generatePageButton = screen.queryByText(
      createMessage(DATASOURCE_GENERATE_PAGE_BUTTON),
    );
    expect(generatePageButton).not.toBeInTheDocument();
  });
});

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
      fetchingDatasourceStructure: [
        "667552bd8b418b52eb273853",
        "667552bd8b418b52eb273853",
      ],
      structure: {
        id: "667552bd8b418b52eb273853",
      },
    },
  },
  ui: {
    ...unitTestBaseMockStore.ui,
    datasourcePane: {
      selectedTableName: "users",
    },
    users: {
      featureFlag: {
        data: {
          release_drag_drop_building_blocks_enabled: true,
        },
      },
    },
  },
};
