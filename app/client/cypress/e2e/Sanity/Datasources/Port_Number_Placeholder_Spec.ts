import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

describe("Test placeholder value for port number for all datasources - tests #24960", () => {
  it("1. Test datasource port number placeholder", () => {
    // MsSQL
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Microsoft SQL Server");

    let expectedPlaceholderValue = "1433";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // Oracle
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Oracle");

    expectedPlaceholderValue = "1521";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);

    // SMTP
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("SMTP");

    expectedPlaceholderValue = "25";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);
  });
});
