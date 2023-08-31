import {
  agHelper,
  adminSettings,
} from "../../../../support/Objects/ObjectsCore";
import { CURRENT_REPO, REPO } from "../../../../fixtures/REPO";

describe("Admin Settings Page - General page validations", () => {
  it("1. TC# 2439 Verify 'Page title' changes upon changing Instance name", () => {
    adminSettings.NavigateToAdminSettings();
    agHelper.ClearNType(adminSettings._instanceName, "Testing Instance name");
    agHelper.ClickButton("Save");
    agHelper.ValidateToastMessage("Successfully saved");
    if (CURRENT_REPO === REPO.CE) cy.title().should("eq", "Appsmith");
    //verifying that Instance name is not changed in CE
    else if (CURRENT_REPO === REPO.EE)
      cy.title().should("eq", "Testing Instance name"); //verifying that Instance name is not changed in EE
  });
});
