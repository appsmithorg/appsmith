import {
  agHelper,
  deployMode,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const cardHeader = '[data-card-zone="header"]';

describe(
  "Card widget inside List v2",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    before(() => {
      // List v2 with a Card in the row template; the card title is
      // bound to {{currentItem.name}} (rows: Blue, Green, Red).
      agHelper.AddDsl("Listv2/simpleListWithCard");
    });

    it("1. Renders one card per row with row-scoped currentItem bindings", () => {
      deployMode.DeployApp(locators._widgetInDeployed("list1"));
      agHelper.GetNAssertElementText(cardHeader, "Blue", "contain.text", 0);
      agHelper.GetNAssertElementText(cardHeader, "Green", "contain.text", 1);
      agHelper.GetNAssertElementText(cardHeader, "Red", "contain.text", 2);
      deployMode.NavigateBacktoEditor();
    });
  },
);
