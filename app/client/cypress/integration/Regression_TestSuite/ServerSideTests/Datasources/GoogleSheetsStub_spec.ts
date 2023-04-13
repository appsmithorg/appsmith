import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Google Sheets datasource test cases", function () {
  it("1. Create Google Sheets datasource", function () {
    cy.intercept("GET", "/api/v1/users/features", {
      fixture: "featureFlags.json",
    }).as("featureFlags");
    cy.reload();
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Google Sheets");
    VerifyFunctionDropdown([
      "Read/Write | Selected Google Sheets",
      "Read/Write | All Google Sheets",
      "Read Files | All Google Sheets",
    ]);
    dataSources.SaveDSFromDialog(false);
  });

  function VerifyFunctionDropdown(scopeOptions: string[]) {
    agHelper.GetNClick(dataSources._gsScopeDropdown);
    cy.get(dataSources._gsScopeOptions).then(function ($ele) {
      expect($ele.eq(0).text()).to.be.oneOf(scopeOptions);
      expect($ele.eq(1).text()).to.be.oneOf(scopeOptions);
      expect($ele.eq(2).text()).to.be.oneOf(scopeOptions);
    });
    agHelper.GetNClick(dataSources._gsScopeDropdown);
  }
});
