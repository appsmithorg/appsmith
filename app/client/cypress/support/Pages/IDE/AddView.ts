import { ObjectsRegistry } from "../../Objects/Registry";

class AddView {
  public locators = {
    closePaneButton: "[data-testid='t--add-pane-close-icon']",
    createOption: "[data-testid='t--create-option']",
  };

  constructor() {
    //
  }

  public assertInAddView() {
    ObjectsRegistry.AggregateHelper.AssertElementVisibility(
      this.locators.closePaneButton,
    );
  }

  public closeAddView() {
    ObjectsRegistry.AggregateHelper.GetNClick(this.locators.closePaneButton);
  }

  public getCreateOptions(): Cypress.Chainable {
    return cy.get(this.locators.createOption);
  }
}

export default AddView;
