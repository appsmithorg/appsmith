import * as _ from "../../../../support/Objects/ObjectsCore";
import adminLocators from "../../../../locators/AdminsSettings";

describe("Evaluates anonymous usage", function () {
  it("Bug: 21191: Even if usage data preference is on, share anonymous usage is unchecked", function () {
    _.homePage.NavigateToHome();
    _.adminSettings.NavigateToAdminSettings();
    _.agHelper.GetElement(adminLocators.usageDataCheckbox).should("be.checked");
    _.agHelper.GetNClick(adminLocators.usageDataCheckbox, 0, true);
    _.agHelper
      .GetElement(adminLocators.usageDataCheckbox)
      .should("not.be.checked");
    _.agHelper.GetNClick(adminLocators.saveButton);
    _.agHelper
      .GetElement(adminLocators.restartNotice, 120000)
      .should("have.length", 0);
  });
});
