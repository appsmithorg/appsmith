import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Google Sheets datasource test cases", function() {
  it("1. Create Google Sheets datasource", function() {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Google Sheets");
    VerifyFunctionDropdown([
      "Read Files",
      "Read, Edit and Create Files",
      "Read, Edit, Create and Delete Files",
    ]);
    agHelper.ClickButton("Delete");
    agHelper.ClickButton("Are you sure?");
    agHelper.ValidateToastMessage("deleted successfully");
   });

  function VerifyFunctionDropdown(scopeOptions: string[]) {
    agHelper.GetNClick(dataSources._gsScopeDropdown);
    cy.get(dataSources._gsScopeOptions).then(function($ele) {
      expect($ele.eq(0).text()).to.be.oneOf(scopeOptions);
      expect($ele.eq(1).text()).to.be.oneOf(scopeOptions);
      expect($ele.eq(2).text()).to.be.oneOf(scopeOptions);
    });
    agHelper.GetNClick(dataSources._gsScopeDropdown);
  }
});
