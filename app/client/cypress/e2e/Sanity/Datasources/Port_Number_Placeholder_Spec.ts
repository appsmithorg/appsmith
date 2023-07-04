import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

describe("Test placeholder value for port number for all datasources - tests #24960", () => {
  it("1. Test MsSQL datasource port number placeholder", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      // using CreatePlugIn function instead of CreateDatasource,
      // because I do not need to fill the datasource form and use the same default data
      dataSources.CreatePlugIn("Microsoft SQL Server");
    });

    const expectedPlaceholderValue = "1433";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);
  });

  it("2. Test Oracle plugin datasource port number placeholder", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      // using CreatePlugIn function instead of CreateDatasource,
      // because I do not need to fill the datasource form and use the same default data
      dataSources.CreatePlugIn("Oracle");
    });

    const expectedPlaceholderValue = "1521";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);
  });

  it("3. Test SMTP plugin datasource port number placeholder", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      // using CreatePlugIn function instead of CreateDatasource,
      // because I do not need to fill the datasource form and use the same default data
      dataSources.CreatePlugIn("SMTP");
    });

    const expectedPlaceholderValue = "25";
    agHelper.AssertAttribute(
      dataSources._port,
      "placeholder",
      expectedPlaceholderValue,
    );
    dataSources.SaveDSFromDialog(false);
  });
});
