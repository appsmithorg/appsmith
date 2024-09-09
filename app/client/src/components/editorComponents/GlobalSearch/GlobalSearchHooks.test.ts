import { useFilteredAndSortedFileOperations } from "./GlobalSearchHooks";
import type { Datasource } from "entities/Datasource";
import { SEARCH_ITEM_TYPES } from "./utils";

describe("getFilteredAndSortedFileOperations", () => {
  it("works without any datasources", () => {
    const fileOptions = useFilteredAndSortedFileOperations({ query: "" });

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
    const actionOperationsWithoutCreate = useFilteredAndSortedFileOperations({
      query: "",
      allDatasources: [],
      recentlyUsedDSMap: {},
      canCreateActions: false,
    });

    expect(actionOperationsWithoutCreate.length).toEqual(0);

    const actionOperationsWithoutDatasourcePermission =
      useFilteredAndSortedFileOperations({
        query: "",
        allDatasources: [],
        recentlyUsedDSMap: {},
        canCreateActions: true,
        canCreateDatasource: false,
      });

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

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "",
      allDatasources: [appDatasource, otherDatasource],
      recentlyUsedDSMap: {},
      canCreateActions: true,
      canCreateDatasource: true,
    });

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

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "",
      allDatasources: [appDatasource, otherDatasource],
      recentlyUsedDSMap: { abc: 1, "123": 3 },
      canCreateActions: true,
      canCreateDatasource: true,
    });

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

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "App",
      allDatasources: [appDatasource, otherDatasource],
      recentlyUsedDSMap: {},
      canCreateActions: true,
      canCreateDatasource: true,
    });

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

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "zzzz",
      allDatasources: [appDatasource, otherDatasource],
      recentlyUsedDSMap: {},
      canCreateActions: true,
      canCreateDatasource: true,
    });

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New datasource",
      }),
    );
  });

  it("should not show new js object option if disableJSObjectCreation is true", () => {
    const fileOptions = useFilteredAndSortedFileOperations({
      query: "new js",
      allDatasources: [],
      recentlyUsedDSMap: {},
      canCreateActions: true,
      canCreateDatasource: true,
      disableJSObjectCreation: true,
    });

    expect(fileOptions.length).toEqual(1);
    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New datasource",
      }),
    );
  });

  it("should show new js object option if disableJSObjectCreation is false", () => {
    const fileOptions = useFilteredAndSortedFileOperations({
      query: "new js",
      allDatasources: [],
      recentlyUsedDSMap: {},
      canCreateActions: true,
      canCreateDatasource: true,
      disableJSObjectCreation: false,
    });

    expect(fileOptions.length).toEqual(2);
    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New JS Object",
      }),
    );
  });

  it("should show new js object option if disableJSObjectCreation is not set", () => {
    const fileOptions = useFilteredAndSortedFileOperations({
      query: "new js",
      allDatasources: [],
      recentlyUsedDSMap: {},
      canCreateActions: true,
      canCreateDatasource: true,
      disableJSObjectCreation: false,
    });

    expect(fileOptions.length).toEqual(2);
    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New JS Object",
      }),
    );
  });
});
