import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const { AggregateHelper: agHelper, CommonLocators } = ObjectsRegistry;

describe(
  "List Widget parse error test",
  { tags: ["@tag.Widget", "@tag.List"] },
  () => {
    it("Button onClick currentItem.task shouldn't throw parse error", () => {
      agHelper.AddDsl("ListWidgetWithDataAndButtonDSL");

      agHelper.ClickButton("Submit");

      // no toast message should be visible
      agHelper
        .GetElement(CommonLocators._toastMsg, "noVerify")
        .should("not.have.length.above", 0);
    });
  },
);
