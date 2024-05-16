import { ObjectsRegistry } from "../../Objects/Registry";

class AddView {
  public locators = {
    addPane: "[data-testid='t--ide-add-pane']",
    closePaneButton: "[data-testid='t--add-pane-close-icon']",
    createOption: (name: string) =>
      ".t--datasoucre-create-option-" + name.toLowerCase().replace(/ /g, "_"),
  };

  constructor() {
    //
  }

  public assertInAddView() {
    ObjectsRegistry.AggregateHelper.AssertElementVisibility(
      this.locators.addPane,
    );
  }

  public closeAddView() {
    ObjectsRegistry.AggregateHelper.GetNClick(this.locators.closePaneButton);
  }

  public clickCreateOption(name: string) {
    ObjectsRegistry.AggregateHelper.GetNClick(this.locators.createOption(name));
  }
}

export default new AddView();
