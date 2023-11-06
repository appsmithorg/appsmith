import { useFilteredAndSortedFileOperations } from "./getFilteredFileOps";
import type { Datasource } from "entities/Datasource";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";

describe("getFilteredAndSortedFileOperations", () => {
  it("works without any datasources", () => {
    const fileOptions = useFilteredAndSortedFileOperations({ query: "" });

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New blank API",
      }),
    );

    expect(fileOptions[1]).toEqual(
      expect.objectContaining({
        title: "New blank GraphQL API",
      }),
    );

    expect(fileOptions[2]).toEqual(
      expect.objectContaining({
        title: "New cURL import",
      }),
    );

    expect(fileOptions[3]).toEqual(
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
      canCreateModules: false,
    });

    expect(actionOperationsWithoutCreate.length).toEqual(0);

    const actionOperationsWithoutDatasourcePermission =
      useFilteredAndSortedFileOperations({
        query: "",
        allDatasources: [],
        recentlyUsedDSMap: {},
        canCreateModules: true,
        canCreateDatasource: false,
      });

    expect(actionOperationsWithoutDatasourcePermission.length).toEqual(3);
  });
  it("shows all datasources", () => {
    const allDatasource: Datasource = {
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
      name: "All datasources",
    };

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "",
      allDatasources: [allDatasource],
      recentlyUsedDSMap: {},
      canCreateModules: true,
      canCreateDatasource: true,
    });

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "Create a query",
        kind: SEARCH_ITEM_TYPES.sectionTitle,
      }),
    );

    expect(fileOptions[1]).toEqual(
      expect.objectContaining({
        title: "New All datasources query",
      }),
    );
  });
  it("sorts datasources based on recency", () => {
    const allDatasources: Datasource = {
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
      name: "All datasources",
    };

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "",
      allDatasources: [allDatasources],
      recentlyUsedDSMap: { abc: 1, "123": 3 },
      canCreateModules: true,
      canCreateDatasource: true,
    });

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "Create a query",
        kind: SEARCH_ITEM_TYPES.sectionTitle,
      }),
    );

    expect(fileOptions[1]).toEqual(
      expect.objectContaining({
        title: "New All datasources query",
      }),
    );
  });
  it("filters with a query", () => {
    const allDatasources: Datasource = {
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
      name: "All datasources",
    };

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "App",
      allDatasources: [allDatasources],
      recentlyUsedDSMap: {},
      canCreateModules: true,
      canCreateDatasource: true,
    });

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New datasource",
      }),
    );
  });
  it("Non matching query shows on datasource creation", () => {
    const allDatasources: Datasource = {
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
      name: "All datasources",
    };

    const fileOptions = useFilteredAndSortedFileOperations({
      query: "zzzz",
      allDatasources: [allDatasources],
      recentlyUsedDSMap: {},
      canCreateModules: true,
      canCreateDatasource: true,
    });

    expect(fileOptions[0]).toEqual(
      expect.objectContaining({
        title: "New datasource",
      }),
    );
  });
});
