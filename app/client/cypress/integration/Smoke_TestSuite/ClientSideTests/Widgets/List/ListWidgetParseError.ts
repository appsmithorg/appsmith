import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const { AggregateHelper: agHelper, CommonLocators } = ObjectsRegistry;

describe("List Widget parse error test", () => {
  it("Button onClick currentItem.task should through parse error", () => {
    cy.fixture("ListWidgetWithDataAndButtonDSL").then((val: any) => {
      agHelper.AddDsl(val);
    });

    agHelper.ClickButton("Submit");

    // no toast message should be visible
    agHelper
      .GetElement(CommonLocators._toastMsg)
      .should("not.have.length.above", 0);
  });
});
