import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import {
  agHelper,
  apiPage,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "API Panel Test Functionality ",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Test API copy/Move/delete feature", function () {
      cy.Createpage("SecondPage");
      cy.CreateAPI("FirstAPI");
      cy.enterDatasourceAndPath(testdata.baseUrl, "{{ '/random' }}");
      agHelper.AssertAutoSave();
      cy.get("body").click(0, 0);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "FirstAPI",
        action: "Copy to page",
        subAction: "SecondPage",
        toastToValidate: "action copied to page",
      });
      // assert GET API is present.
      apiPage.AssertAPIVerb("GET");
      cy.get("body").click(0, 0);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "FirstAPICopy",
        action: "Move to page",
        subAction: "Page1",
        toastToValidate: "action moved to page",
      });
      cy.wait(2000);
      EditorNavigation.SelectEntityByName("FirstAPICopy", EntityType.Api);
      cy.get(apiwidget.resourceUrl).should("contain.text", "{{ '/random' }}");
    });
  },
);
