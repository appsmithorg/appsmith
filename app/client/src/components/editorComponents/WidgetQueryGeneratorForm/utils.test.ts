import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import { getDatasourceConnectionMode } from "./utils";
import type { DatasourceStorage } from "entities/Datasource";
import { PluginPackageName } from "entities/Plugin";
import PostgreSQL from "WidgetQueryGenerators/PostgreSQL";
import GSheets from "WidgetQueryGenerators/GSheets";

describe("getDatasourceConnectionMode", () => {
  beforeAll(() => {
    WidgetQueryGeneratorRegistry.register(
      PluginPackageName.POSTGRES,
      PostgreSQL,
    );
    WidgetQueryGeneratorRegistry.register(
      PluginPackageName.GOOGLE_SHEETS,
      GSheets,
    );
  });

  it("should return the connection mode from the query generator", () => {
    expect(
      getDatasourceConnectionMode(PluginPackageName.POSTGRES, {
        connection: {
          mode: "READ_ONLY",
        },
      } as DatasourceStorage["datasourceConfiguration"]),
    ).toEqual("READ_ONLY");

    expect(
      getDatasourceConnectionMode(PluginPackageName.GOOGLE_SHEETS, {
        authentication: {
          scopeString: "spreadsheets.readonly",
        },
      } as DatasourceStorage["datasourceConfiguration"]),
    ).toEqual("READ_ONLY");

    expect(
      getDatasourceConnectionMode(PluginPackageName.GOOGLE_SHEETS, {
        authentication: {
          scopeString: "spreadsheets",
        },
      } as DatasourceStorage["datasourceConfiguration"]),
    ).toEqual("READ_WRITE");
  });

  it("should return null if the query generator is not found", () => {
    const result = getDatasourceConnectionMode(
      "non-existent-plugin-package-name",
      {
        connection: {
          mode: "READ_ONLY",
        },
      } as DatasourceStorage["datasourceConfiguration"],
    );

    expect(result).toBe(undefined);
  });
});
