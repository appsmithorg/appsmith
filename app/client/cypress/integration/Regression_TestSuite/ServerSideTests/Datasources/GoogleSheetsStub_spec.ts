import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Google Sheets datasource test cases", function() {
  // Commenting out this test, with limiting gsheet access implementation
  // new UI would be implemented

  // it("1. Create Google Sheets datasource", function() {
  //   cy.intercept("GET", "/api/v1/users/features", {
  //     fixture: "featureFlags.json",
  //   }).as("featureFlags");
  //   cy.reload();
  //   dataSources.NavigateToDSCreateNew();
  //   dataSources.CreatePlugIn("Google Sheets");
  //   VerifyFunctionDropdown([
  //     "Read Files",
  //     "Read, Edit and Create Files",
  //     "Read, Edit, Create and Delete Files",
  //   ]);
  //   dataSources.SaveDSFromDialog(false);
  // });

  it("1. Create Google Sheets datasource with Limiting Google Sheet Access flow", function() {
    cy.intercept("GET", "/api/v1/users/features", {
      fixture: "featureFlags.json",
    }).as("featureFlags");
    cy.reload();
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Google Sheets");

    // Verify that specific sheets is selected by default
    agHelper.VerifyIfRadioOptionChecked(
      dataSources._gsRadioButton,
      "SPECIFIC_SHEETS",
    );

    // Verify the dropdown options in case of all sheets
    agHelper.CheckRadioButtonWithValue(
      dataSources._gsRadioButton,
      "ALL_SHEETS",
    );
    VerifyFunctionDropdown(
      [
        "Read Files",
        "Read, Edit and Create Files",
        "Read, Edit, Create and Delete Files",
      ],
      dataSources._gsScopeDropdown,
    );
    dataSources.SaveDSFromDialog(false);
  });

  function VerifyFunctionDropdown(scopeOptions: string[], selector: string) {
    agHelper.GetNClick(selector);
    cy.get(dataSources._gsScopeOptions).then(function($ele) {
      expect($ele.eq(0).text()).to.be.oneOf(scopeOptions);
      expect($ele.eq(1).text()).to.be.oneOf(scopeOptions);
      expect($ele.eq(2).text()).to.be.oneOf(scopeOptions);
    });
    agHelper.GetNClick(dataSources._gsScopeDropdown);
  }
});
