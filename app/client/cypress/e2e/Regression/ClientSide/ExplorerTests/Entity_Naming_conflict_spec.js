import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Tab widget test",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    const apiName = "Table1";
    const tableName = "Table1";
    before(() => {
      _.agHelper.AddDsl("basicTabledsl");
    });

    it("1. Rename API with table widget name validation test", function () {
      cy.log("Login Successful");
      cy.CreateApiAndValidateUniqueEntityName(apiName);
      cy.get(apiwidget.apiTxt)
        .clear()
        .type(tableName, { force: true })
        .should("have.value", tableName);
      //Rename Table widget with api name validation test
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.assertPresence("Table1");
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      cy.RenameEntity(apiName);
      cy.validateMessage(apiName);
    });
  },
);
