import { ObjectsRegistry } from "../Objects/Registry";

export class PeekOverlay {
  private readonly locators = {
    _overlayContainer: "#t--peek-overlay-container",
    _dataContainer: "#t--peek-overlay-data",
    _dataTypeContainer: '[data-testid="t--peek-overlay-data-type"]',

    // react json viewer selectors
    _rjv_variableValue: ".variable-value",
    _rjv_topLevelArrayData:
      ".pushed-content.object-container .object-content .object-key-val",
    _rjv_firstLevelBraces:
      ".pretty-json-container > .object-content:first-of-type > .object-key-val:first-of-type > span",
    _fileOperation: (operation: string) =>
      `.t--file-operation:contains("${operation}")`,
  };
  private readonly agHelper = ObjectsRegistry.AggregateHelper;

  HoverCode(lineNumber: number, tokenNumber: number, verifyText: string) {
    this.agHelper
      .GetElement(".CodeMirror-line")
      .eq(lineNumber)
      .children()
      .children()
      .eq(tokenNumber)
      .should("have.text", verifyText)
      .then(($el) => {
        const pos = $el[0].getBoundingClientRect();
        this.HoverByPosition({ x: pos.left, y: pos.top });
      });
  }

  IsOverlayOpen(checkIsOpen = true) {
    checkIsOpen
      ? this.agHelper.AssertElementExist(this.locators._overlayContainer)
      : this.agHelper.AssertElementAbsence(this.locators._overlayContainer);
  }

  HoverByPosition(position: { x: number; y: number }) {
    this.agHelper.GetElement("body").realHover({ position });
    this.agHelper.Sleep();
  }

  ResetHover() {
    this.agHelper
      .GetElement(".CodeMirror-code")
      .realHover({ position: "bottomLeft" });
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
      .GetElement(this.locators._dataTypeContainer)
      .eq(0)
      .should("have.text", type);
  }
}
