import { ObjectsRegistry } from "../../../support/Objects/Registry";

let dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "excludeForAirgap",
  "Google Sheets datasource test cases",
  function () {
    it("1. Create Google Sheets datasource", function () {
      cy.intercept("GET", "/api/v1/users/features", {
        fixture: "featureFlags.json",
      }).as("featureFlags");
      cy.reload();
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Google Sheets");
      VerifyFunctionDropdown([
        "Read / Write / Delete | Selected google sheets",
        "Read / Write / Delete | All google sheets",
        "Read / Write | All google sheets",
        "Read | All google sheets",
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
  },
);
