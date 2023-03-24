import { POSTGRE_SQL_PLUGIN_ID } from "DataSourceAdaptors/PostgreSQL";
import DataSourceRegistry from "./dataSourceRegistry";

describe("boxHelpers", () => {
  it("should have PostgreSQL adaptor registered", () => {
    const postgreSQLAdaptor = DataSourceRegistry.getAdaptor(
      POSTGRE_SQL_PLUGIN_ID,
    );
    expect(postgreSQLAdaptor).toBeTruthy();
    const applicationId = "someApplicationID";
    const workspaceId = "someWorkspaceID";

    //check it is building some config
    expect(postgreSQLAdaptor.build({ applicationId, workspaceId })).toEqual({
      applicationId,
      workspaceId,
    });
  });
});
