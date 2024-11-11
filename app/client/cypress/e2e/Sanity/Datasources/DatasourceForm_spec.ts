import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../support/Pages/EditorNavigation";

const testdata = require("../../../fixtures/testdata.json");
import {
  agHelper,
  entityExplorer,
  apiPage,
  locators,
  dataSources,
} from "../../../support/Objects/ObjectsCore";

describe(
  "Datasource form related tests",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    it("1. Check whether the number of key value pairs is equal to number of delete buttons", function () {
      apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
      cy.get(".t--store-as-datasource").click();

      agHelper.AssertElementAbsence(
        locators._specificToast("Duplicate key error"),
      ); //verifying there is no error toast, Bug 14566

      cy.get(".t--add-field").first().click();

      // Two array pairs for headers key,value should have 2 delete buttons as per new uqi designs, so the first header can also be deleted : Bug #14804
      cy.get(".t--headers-array .t--delete-field")
        .children()
        .should("have.length", 2);
      // Check if save button is disabled
      cy.get(".t--save-datasource").should("not.be.disabled");
      dataSources.SaveDSFromDialog();
      //Check if saved api as a datasource does not fail on cloning", function () {

      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Api1",
        action: "Copy to page",
        subAction: "Page1",
        toastToValidate: "action copied to page Page1 successfully",
      });
    });
  },
);
