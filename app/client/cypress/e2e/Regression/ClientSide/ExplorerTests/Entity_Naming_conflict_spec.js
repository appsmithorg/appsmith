import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

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
      //Rename Table widget with api name validation test
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.assertPresence("Table1");
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      cy.CreationOfUniqueAPIcheck(apiName);
    });
  },
);
