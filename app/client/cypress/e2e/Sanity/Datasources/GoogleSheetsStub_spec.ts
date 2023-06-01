import * as _ from "../../../support/Objects/ObjectsCore";

describe(
  "excludeForAirgap",
  "Google Sheets datasource test cases",
  function () {
    it("1. Create Google Sheets datasource", function () {
      cy.intercept("GET", "/api/v1/users/features", {
        fixture: "featureFlags.json",
      }).as("featureFlags");
      _.dataSources.NavigateToDSCreateNew();
      _.dataSources.CreatePlugIn("Google Sheets");
      VerifyFunctionDropdown([
        "Read / Write / Delete | Selected google sheets",
        "Read / Write / Delete | All google sheets",
        "Read / Write | All google sheets",
        "Read | All google sheets",
      ]);
      _.dataSources.SaveDSFromDialog(false);
    });

    function VerifyFunctionDropdown(scopeOptions: string[]) {
      _.agHelper.GetNClick(_.dataSources._gsScopeDropdown);
      cy.get(_.dataSources._gsScopeOptions).then(function ($ele) {
        expect($ele.eq(0).text()).to.be.oneOf(scopeOptions);
        expect($ele.eq(1).text()).to.be.oneOf(scopeOptions);
        expect($ele.eq(2).text()).to.be.oneOf(scopeOptions);
      });
      _.agHelper.GetNClick(_.dataSources._gsScopeDropdown);
    }
  },
);
