import { ObjectsRegistry } from "../Objects/Registry";

export class PeekOverlay {
  private readonly locators = {
    _overlayContainer: "#t--peek-overlay-container",
    _dataContainer: "#t--peek-overlay-data",

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

  // Please skip for now - testing on CI because local setup doesn't work
  HoverCode(lineNumber: number, tokenNumber: number, verifyText: string) {
    this.agHelper
      .GetElement(
        `(//pre[contains(@class, "CodeMirror-line")])[${lineNumber}]/span/span[${tokenNumber}]`,
      )
      .should("have.text", verifyText)
      .realHover();
    this.agHelper
      .GetElement(
        `(//pre[contains(@class, "CodeMirror-line")])[${lineNumber}]/span/span[${tokenNumber}]`,
      )
      .invoke("val")
      .then((val) => val && cy.log("mouse over triggered " + val.toString()));
    // this.agHelper
    //   .GetElement(".CodeMirror-line > span")
    //   .eq(lineNumber)
    //   .children(".cm-m-javascript")
    //   .eq(tokenNumber)
    //   .should("have.text", verifyText)
    //   .trigger("mouseover");
    //   .then((el: any) => el.realHover());
    this.agHelper.Sleep(1000);
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
