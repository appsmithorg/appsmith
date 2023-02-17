import { ObjectsRegistry } from "../Objects/Registry";

export class PeekOverlay {
  private readonly PEEKABLE_ATTRIBUTE = "peek-data";
  private readonly locators = {
    _overlayContainer: "#t--peek-overlay-container",
    _dataContainer: "#t--peek-overlay-data",
    _peekableCode: (peekableAttr: string) =>
      `[${this.PEEKABLE_ATTRIBUTE}="${peekableAttr}"]`,

    // react json viewer selectors
    _rjv_variableValue: ".variable-value",
    _rjv_topLevelArrayData:
      ".pushed-content.object-container .object-content .object-key-val",
    _rjv_firstLevelBraces:
      ".pretty-json-container > .object-content:first-of-type > .object-key-val:first-of-type > span",
  };
  private readonly agHelper = ObjectsRegistry.AggregateHelper;

  HoverCode(peekableAttribute: string, visibleText?: string) {
    (visibleText
      ? this.agHelper.GetNAssertContains(
          this.locators._peekableCode(peekableAttribute),
          visibleText,
        )
      : this.agHelper.GetElement(this.locators._peekableCode(peekableAttribute))
    ).realHover();
    this.agHelper.Sleep();
  }

  IsOverlayOpen(checkIsOpen = true) {
    checkIsOpen
      ? this.agHelper.AssertElementExist(this.locators._overlayContainer)
      : this.agHelper.AssertElementAbsence(this.locators._overlayContainer);
  }

  ResetHover() {
    this.agHelper.GetElement("body").realHover({ position: "bottomLeft" });
    this.agHelper.Sleep();
  }

  CheckPrimitiveValue(data: string) {
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .children("div")
      .should("have.text", data);
  }

  CheckPrimitveArrayInOverlay(array: Array<string | number>) {
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_variableValue)
      .should("have.length", array.length);
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_firstLevelBraces)
      .eq(0)
      .contains("[");
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_firstLevelBraces)
      .eq(1)
      .contains("]");
  }

  CheckObjectArrayInOverlay(array: Array<Record<string, any>>) {
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_topLevelArrayData)
      .should("have.length", array.length);
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_firstLevelBraces)
      .eq(0)
      .contains("[");
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_firstLevelBraces)
      .eq(1)
      .contains("]");
  }

  CheckBasicObjectInOverlay(object: Record<string, string | number>) {
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_variableValue)
      .should("have.length", Object.entries(object).length);
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_firstLevelBraces)
      .eq(0)
      .contains("{");
    this.agHelper
      .GetElement(this.locators._dataContainer)
      .find(this.locators._rjv_firstLevelBraces)
      .eq(1)
      .contains("}");
  }

  VerifyDataType(type: string) {
    this.agHelper
      .GetElement(this.locators._overlayContainer)
      .children("div")
      .eq(0)
      .should("have.text", type);
  }
}
