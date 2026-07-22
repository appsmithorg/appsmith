import {
  agHelper,
  deployMode,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const cardHeader = '[data-card-zone="header"]';

// Row titles bound to {{currentItem.name}} in simpleListWithCard, one per
// repeated row. Named to avoid inline assertion strings.
const ROW_TITLES = ["Blue", "Green", "Red"];

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
      ROW_TITLES.forEach((title, index) => {
        agHelper.GetNAssertElementText(
          cardHeader,
          title,
          "contain.text",
          index,
        );
      });
      deployMode.NavigateBacktoEditor();
    });
  },
);
