import { ObjectsRegistry } from "../Objects/Registry";

export class PeekOverlay {
  private readonly PEEKABLE_ATTRIBUTE = "peek-data";
  private readonly locators = {
    overlayContainer: "#t--peek-overlay-container",
    dataContainer: "#t--peek-overlay-data",
    peekableCode: (peekableAttr: string) =>
      `[${this.PEEKABLE_ATTRIBUTE}="${peekableAttr}"]`,

    // react json viewer selectors
    rjv_variableValue: ".variable-value",
    rjv_topLevelArrayData:
      ".pushed-content.object-container .object-content .object-key-val",
    rjv_firstLevelBraces:
      ".pretty-json-container > .object-content:first-of-type > .object-key-val:first-of-type > span",
  };
  private readonly agHelper = ObjectsRegistry.AggregateHelper;

  hoverCode(peekableAttribute: string, visibleText?: string) {
    (visibleText
      ? this.agHelper.GetNAssertContains(
          this.locators.peekableCode(peekableAttribute),
          visibleText,
        )
      : this.agHelper.GetElement(this.locators.peekableCode(peekableAttribute))
    ).realHover();
    cy.wait(1000);
  }

  isOverlayOpen(checkIsOpen = true) {
    checkIsOpen
      ? this.agHelper.AssertElementExist(this.locators.overlayContainer)
      : this.agHelper.AssertElementAbsence(this.locators.overlayContainer);
  }

  resetHover() {
    this.agHelper.GetElement("body").realHover({ position: "bottomLeft" });
    cy.wait(1000);
  }

  checkPrimitiveData(data: string) {
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .children("div")
      .should("have.text", data);
  }

  checkPrimitveArrayInOverlay(array: Array<string | number>) {
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_variableValue)
      .should("have.length", array.length);
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_firstLevelBraces)
      .eq(0)
      .contains("[");
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_firstLevelBraces)
      .eq(1)
      .contains("]");
  }

  checkObjectArrayInOverlay(array: Array<Record<string, any>>) {
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_topLevelArrayData)
      .should("have.length", array.length);
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_firstLevelBraces)
      .eq(0)
      .contains("[");
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_firstLevelBraces)
      .eq(1)
      .contains("]");
  }

  checkBasicObjectInOverlay(object: Record<string, any>) {
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_variableValue)
      .should("have.length", Object.entries(object).length);
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_firstLevelBraces)
      .eq(0)
      .contains("{");
    this.agHelper
      .GetElement(this.locators.dataContainer)
      .find(this.locators.rjv_firstLevelBraces)
      .eq(1)
      .contains("}");
  }

  verifyDataType(type: string) {
    this.agHelper
      .GetElement(this.locators.overlayContainer)
      .children("div")
      .eq(0)
      .should("have.text", type);
  }
}
