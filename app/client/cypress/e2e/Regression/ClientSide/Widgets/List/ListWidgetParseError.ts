import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const { AggregateHelper: agHelper, CommonLocators } = ObjectsRegistry;

describe("List Widget parse error test", () => {
  it("Button onClick currentItem.task shouldn't throw parse error", () => {
    agHelper.AddDsl("ListWidgetWithDataAndButtonDSL");

    agHelper.ClickButton("Submit");

    // no toast message should be visible
    agHelper
      .GetElement(CommonLocators._toastMsg)
      .should("not.have.length.above", 0);
  });
});
