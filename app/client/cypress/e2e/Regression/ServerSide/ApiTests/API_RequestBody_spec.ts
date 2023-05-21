import * as _ from "../../../../support/Objects/ObjectsCore";

describe("API Panel request body", function () {
  it("1. Check whether input exists when form-encoded is selected", function () {
    _.apiPage.CreateApi("FirstAPI");
    _.apiPage.SelectAPIVerb("POST");
    _.apiPage.SelectPaneTab("Body");
    _.apiPage.SelectSubTab("FORM_URLENCODED");
    _.agHelper.AssertElementVisible(_.apiPage._bodyKey(0));
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });
});
