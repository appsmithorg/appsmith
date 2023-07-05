import { getFilteredAndSortedFileOperations } from "./GlobalSearchHooks";
import type { Datasource } from "entities/Datasource";
import { SEARCH_ITEM_TYPES } from "./utils";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";

describe("getFilteredAndSortedFileOperations", () => {
  it("works without any datasources", () => {
    const fileOptions = getFilteredAndSortedFileOperations("");

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New JS Object",
      }),
    );

    expect(fileOptions[1]).toEqual(
      expect.objectContaining({
        title: "New blank API",
      }),
    );

    expect(fileOptions[2]).toEqual(
      expect.objectContaining({
        title: "New blank GraphQL API",
      }),
    );

    expect(fileOptions[3]).toEqual(
      expect.objectContaining({
        title: "New cURL import",
      }),
    );

    expect(fileOptions[4]).toEqual(
      expect.objectContaining({
        title: "New datasource",
      }),
    );
  });
  it("works without permissions", () => {
    const actionOperationsWithoutCreate = getFilteredAndSortedFileOperations(
      "",
      [],
      [],
      {},
      false,
    );

    expect(actionOperationsWithoutCreate.length).toEqual(0);

    const actionOperationsWithoutDatasourcePermission =
      getFilteredAndSortedFileOperations("", [], [], {}, true, false);

    expect(actionOperationsWithoutDatasourcePermission.length).toEqual(4);
  });

  it("shows app datasources before other datasources", () => {
    const appDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: true,
        },
      },
      id: "",
      pluginId: "",
      workspaceId: "",
      name: "App datasource",
    };

    const otherDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: false,
        },
      },
      id: "",
      pluginId: "",
      workspaceId: "",
      name: "Other datasource",
    };

    const fileOptions = getFilteredAndSortedFileOperations(
      "",
      [appDatasource],
      [otherDatasource],
      {},
      true,
      true,
      [
        PERMISSION_TYPE.CREATE_ACTIONS,
        PERMISSION_TYPE.CREATE_DATASOURCE_ACTIONS,
      ],
    );

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New JS Object",
      }),
    );

    expect(fileOptions[1]).toEqual(
      expect.objectContaining({
        title: "Create a query",
        kind: SEARCH_ITEM_TYPES.sectionTitle,
      }),
    );

    expect(fileOptions[2]).toEqual(
      expect.objectContaining({
        title: "New App datasource query",
      }),
    );

    expect(fileOptions[3]).toEqual(
      expect.objectContaining({
        title: "New Other datasource query",
      }),
    );
  });

  it("sorts datasources based on recency", () => {
    const appDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: true,
        },
      },
      id: "123",
      pluginId: "",
      workspaceId: "",
      name: "App datasource",
    };

    const otherDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: false,
        },
      },
      id: "abc",
      pluginId: "",
      workspaceId: "",
      name: "Other datasource",
    };

    const fileOptions = getFilteredAndSortedFileOperations(
      "",
      [appDatasource],
      [otherDatasource],
      { abc: 1, "123": 3 },
      true,
      true,
      [
        PERMISSION_TYPE.CREATE_ACTIONS,
        PERMISSION_TYPE.CREATE_DATASOURCE_ACTIONS,
      ],
    );

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New JS Object",
      }),
    );

    expect(fileOptions[1]).toEqual(
      expect.objectContaining({
        title: "Create a query",
        kind: SEARCH_ITEM_TYPES.sectionTitle,
      }),
    );

    expect(fileOptions[2]).toEqual(
      expect.objectContaining({
        title: "New Other datasource query",
      }),
    );

    expect(fileOptions[3]).toEqual(
      expect.objectContaining({
        title: "New App datasource query",
      }),
    );
  });

  it("filters with a query", () => {
    const appDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: true,
        },
      },
      id: "",
      pluginId: "",
      workspaceId: "",
      name: "App datasource",
    };

    const otherDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: false,
        },
      },
      id: "",
      pluginId: "",
      workspaceId: "",
      name: "Other datasource",
    };

    const fileOptions = getFilteredAndSortedFileOperations(
      "App",
      [appDatasource],
      [otherDatasource],
      {},
      true,
      true,
      [
        PERMISSION_TYPE.CREATE_ACTIONS,
        PERMISSION_TYPE.CREATE_DATASOURCE_ACTIONS,
      ],
    );

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New App datasource query",
      }),
    );
  });

  it("Non matching query shows on datasource creation", () => {
    const appDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: true,
        },
      },
      id: "",
      pluginId: "",
      workspaceId: "",
      name: "App datasource",
    };

    const otherDatasource: Datasource = {
      datasourceStorages: {
        unused_env: {
          datasourceId: "",
          environmentId: "",
          datasourceConfiguration: {
            url: "",
          },
          isValid: false,
        },
      },
      id: "",
      pluginId: "",
      workspaceId: "",
      name: "Other datasource",
    };

    const fileOptions = getFilteredAndSortedFileOperations(
      "zzzz",
      [appDatasource],
      [otherDatasource],
      {},
      true,
      true,
    );

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New datasource",
      }),
    );
  });
});
