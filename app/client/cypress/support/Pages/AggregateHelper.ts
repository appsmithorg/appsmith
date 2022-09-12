import "cypress-wait-until";
const uuid = require("uuid");
import { ObjectsRegistry } from "../Objects/Registry";

type ElementType = string | JQuery<HTMLElement>;

let LOCAL_STORAGE_MEMORY: any = {};
export interface IEnterValue {
  propFieldName: string;
  directInput: boolean;
  inputFieldName: string;
}

const DEFAULT_ENTERVALUE_OPTIONS = {
  propFieldName: "",
  directInput: false,
  inputFieldName: "",
};
export class AggregateHelper {
  private locator = ObjectsRegistry.CommonLocators;

  private isMac = Cypress.platform === "darwin";
  private selectLineNRemove = `${
    this.isMac
      ? "{cmd}{shift}{leftArrow}{backspace}"
      : "{shift}{home}{backspace}"
  }`;
  private selectAll = `${
    this.isMac ? "{cmd}{a}" : "{ctrl}{a}"
  }`;

  private selectChars = (noOfChars: number) =>
    `${"{leftArrow}".repeat(noOfChars) + "{shift}{cmd}{leftArrow}{backspace}"}`;

  public SaveLocalStorageCache() {
    Object.keys(localStorage).forEach((key) => {
      LOCAL_STORAGE_MEMORY[key] = localStorage[key];
    });
  }

  public RestoreLocalStorageCache() {
    Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
      localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
    });
  }

  public ClearLocalStorageCache() {
    localStorage.clear();
    LOCAL_STORAGE_MEMORY = {};
  }

  public TypeTab(shiftKey = false, ctrlKey = false) {
    cy.focused().trigger("keydown", {
      keyCode: 9,
      which: 9,
      shiftKey: shiftKey,
      ctrlKey: ctrlKey,
    });
  }

  public AddDsl(
    dsl: string,
    elementToCheckPresenceaftDslLoad: string | "" = "",
  ) {
    let pageid: string;
    let layoutId;
    cy.url().then((url) => {
      pageid = url
        .split("/")[5]
        ?.split("-")
        .pop() as string;
      cy.log(pageid + "page id");
      //Fetch the layout id
      cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
        const respBody = JSON.stringify(response.body);
        layoutId = JSON.parse(respBody).data.layouts[0].id;
        // Dumping the DSL to the created page
        cy.request(
          "PUT",
          "api/v1/layouts/" + layoutId + "/pages/" + pageid,
          dsl,
        ).then((dslDumpResp) => {
          //cy.log("Pages resposne is : " + dslDumpResp.body);
          expect(dslDumpResp.status).equal(200);
          this.RefreshPage();
        });
      });
    });

    if (elementToCheckPresenceaftDslLoad)
      this.WaitUntilEleAppear(elementToCheckPresenceaftDslLoad);
    this.Sleep(500); //settling time for dsl
    cy.get(this.locator._loading).should("not.exist"); //Checks the spinner is gone & dsl loaded!
  }

  public StartRoutes() {
    cy.intercept("POST", "/api/v1/actions").as("createNewApi");
    cy.intercept("PUT", "/api/v1/actions/*").as("saveAction");
    //cy.intercept("POST", "/api/v1/users/invite", (req) => { req.headers["origin"] = "Cypress";}).as("mockPostInvite");
  }

  public RenameWithInPane(renameVal: string, query = true) {
    const name = query ? this.locator._queryName : this.locator._dsName;
    const text = query ? this.locator._queryNameTxt : this.locator._dsNameTxt;
    cy.get(name).click({ force: true });
    cy.get(text)
      .clear({ force: true })
      .type(renameVal, { force: true })
      .should("have.value", renameVal)
      .blur();
    this.Sleep();
  }

  public RenameWidget(oldName: string, newName: string) {
    this.GetNClick(this.locator._widgetName(oldName));
    cy.get(this.locator._widgetNameTxt)
      .clear({ force: true })
      .type(newName, { force: true })
      .should("have.value", newName)
      .blur();
    this.Sleep();
  }

  public AssertAutoSave() {
    // wait for save query to trigger & n/w call to finish occuring
    cy.get(this.locator._saveStatusSuccess, { timeout: 30000 }).should("exist"); //adding timeout since waiting more time is not worth it!
  }

  public ValidateCodeEditorContent(selector: string, contentToValidate: any) {
    cy.get(selector).within(() => {
      cy.get(this.locator._codeMirrorCode).should(
        "have.text",
        contentToValidate,
      );
    });
  }

  public GetElement(selector: ElementType, timeout = 20000) {
    let locator;
    if (typeof selector == "string") {
      locator = selector.startsWith("//")
        ? cy.xpath(selector, { timeout: timeout })
        : cy.get(selector, { timeout: timeout });
    } else locator = cy.wrap(selector);
    return locator;
  }

  public GetNAssertElementText(
    selector: string,
    text: string,
    textPresence: "have.text" | "contain.text" | "not.have.text" = "have.text",
    index = 0,
  ) {
    if (index >= 0)
      this.GetElement(selector)
        .eq(index)
        .should(textPresence, text);
    else this.GetElement(selector).should(textPresence, text);
  }

  public ValidateToastMessage(text: string, index = 0, length = 1) {
    this.GetElement(this.locator._toastMsg)
      .should("have.length.at.least", length)
      .eq(index)
      .should("contain.text", text);
  }

  public ClickButton(btnVisibleText: string, index = 0, shouldSleep = true) {
    cy.xpath(this.locator._spanButton(btnVisibleText))
      .eq(index)
      .scrollIntoView()
      .click({ force: true });
    shouldSleep && this.Sleep();
  }

  public Paste(selector: any, pastePayload: string) {
    cy.wrap(selector).then(($destination) => {
      const pasteEvent = Object.assign(
        new Event("paste", { bubbles: true, cancelable: true }),
        {
          clipboardData: {
            getData: () => pastePayload,
          },
        },
      );
      $destination[0].dispatchEvent(pasteEvent);
    });
  }

  public WaitUntilToastDisappear(
    msgToCheckforDisappearance: string | "",
    index = 0,
    length = 1,
  ) {
    this.ValidateToastMessage(msgToCheckforDisappearance, index, length);
    cy.waitUntil(() => cy.get(this.locator._toastMsg), {
      errorMsg: msgToCheckforDisappearance + " did not disappear",
      timeout: 5000,
      interval: 1000,
    }).then(($ele) => {
      cy.wrap($ele)
        .contains(msgToCheckforDisappearance)
        .should("have.length", 0);
      this.Sleep();
    });
  }

  public WaitUntilEleDisappear(selector: string) {
    let locator = selector.includes("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    locator.waitUntil(($ele) => cy.wrap($ele).should("have.length", 0), {
      errorMsg: "Element did not disappear even after 10 seconds",
      timeout: 10000,
      interval: 1000,
    });
  }

  public WaitUntilAllToastsDisappear() {
    cy.get(this.locator._toastContainer).waitUntil(
      ($ele) =>
        cy
          .wrap($ele)
          .children()
          .should("have.length", 0),
      {
        errorMsg: "Toasts did not disappear even after 10 seconds",
        timeout: 10000,
        interval: 1000,
      },
    );
  }

  public WaitUntilEleAppear(selector: string) {
    let locator = selector.includes("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    locator.waitUntil(($ele) => cy.wrap($ele).should("be.visible"), {
      errorMsg: "Element did not appear even after 10 seconds",
      timeout: 10000,
      interval: 1000,
    });

    //Below can be tried if above starts being flaky:
    // cy.waitUntil(() => cy.get(selector, { timeout: 50000 }).should("have.length.greaterThan", 0)
    //or
    // cy.waitUntil(()) => (selector.includes("//") ? cy.xpath(selector) : cy.get(selector))).then(($ele) => { cy.wrap($ele).eq(0).should("be.visible");});
  }

  public ValidateNetworkExecutionSuccess(
    aliasName: string,
    expectedRes = true,
  ) {
    cy.wait(aliasName).should(
      "have.nested.property",
      "response.body.data.isExecutionSuccess",
      expectedRes,
    );
  }

  public ValidateNetworkDataSuccess(aliasName: string, expectedRes = true) {
    cy.wait(aliasName).should(
      "have.nested.property",
      "response.body.data.success",
      expectedRes,
    );
  }

  public ValidateNetworkStatus(aliasName: string, expectedStatus = 200) {
    cy.wait(aliasName).should(
      "have.nested.property",
      "response.body.responseMeta.status",
      expectedStatus,
    );
  }

  public ValidateNetworkDataAssert(
    aliasName: string,
    expectedPath: string,
    expectedRes: any,
  ) {
    cy.wait(aliasName).should(
      "have.nested.property",
      expectedPath,
      expectedRes,
    );
  }

  public SelectDropDown(dropdownOption: string, endpoint = "selectwidget") {
    const mode = window.localStorage.getItem("inDeployedMode");
    if (mode == "false") {
      cy.xpath(this.locator._selectWidgetDropdown(endpoint))
        .first()
        .scrollIntoView()
        .click();
    } else {
      cy.xpath(this.locator._selectWidgetDropdownInDeployed(endpoint))
        .first()
        .scrollIntoView()
        .click();
    }
    if (endpoint == "selectwidget")
      cy.get(this.locator._selectOptionValue(dropdownOption)).click({
        force: true,
      });
    else
      cy.get(this.locator._dropDownValue(dropdownOption)).click({
        force: true,
      });

    this.Sleep(); //for selected value to reflect!
  }

  public SelectFromDropDown(
    dropdownOption: string,
    insideParent = "",
    index = 0,
    endpoint = "dropdownwidget",
  ) {
    const mode = window.localStorage.getItem("inDeployedMode");
    //cy.log("mode frm deployed is:" + mode)
    const modeSelector =
      mode == "true"
        ? this.locator._selectWidgetDropdownInDeployed(endpoint)
        : this.locator._selectWidgetDropdown(endpoint);
    const finalSelector = insideParent
      ? this.locator._divWithClass(insideParent) + modeSelector
      : modeSelector;
    cy.log(finalSelector);
    cy.xpath(finalSelector)
      .eq(index)
      .scrollIntoView()
      .click();
    cy.get(this.locator._dropDownValue(dropdownOption)).click({ force: true });
    this.Sleep(); //for selected value to reflect!
  }

  public SelectDropdownList(ddName: string, dropdownOption: string) {
    this.GetNClick(this.locator._existingFieldTextByName(ddName));
    cy.get(this.locator._dropdownText)
      .contains(dropdownOption)
      .click();
  }

  public SelectFromMultiSelect(
    options: string[],
    index = 0,
    check = true,
    endpoint = "multiselectwidgetv2",
  ) {
    cy.get(this.locator._widgetInDeployed(endpoint) + " div.rc-select-selector")
      .eq(index)
      .scrollIntoView()
      .then(($element: any) => {
        // here, we try to click on downArrow in dropdown of multiSelect.
        // the position is calculated from top left of the element
        const dropdownCenterPosition = +$element.height / 2;
        const dropdownArrowApproxPosition = +$element.width - 10;
        cy.get($element).click(
          dropdownArrowApproxPosition,
          dropdownCenterPosition,
          {
            force: true,
          },
        );
      });

    if (check) {
      options.forEach(($each) => {
        cy.get(this.locator._multiSelectOptions($each))
          .check({ force: true })
          .wait(1000);
        cy.get(this.locator._multiSelectOptions($each)).should("be.checked");
      });
    } else {
      options.forEach(($each) => {
        cy.get(this.locator._multiSelectOptions($each))
          .uncheck({ force: true })
          .wait(1000);
        cy.get(this.locator._multiSelectOptions($each)).should(
          "not.be.checked",
        );
      });
    }

    // //closing multiselect dropdown
    this.PressEscape();
    // cy.get(this.locator._widgetInDeployed(endpoint))
    //     .eq(index)
    //     .click()
  }

  public PressEscape() {
    cy.get("body").type("{esc}");
  }

  public PressDelete() {
    cy.get("body").type(`{del}`, { force: true });
  }

  public RemoveMultiSelectItems(items: string[]) {
    items.forEach(($each) => {
      cy.xpath(this.locator._multiSelectItem($each))
        .eq(0)
        .click()
        .wait(1000);
    });
  }

  public ReadSelectedDropDownValue() {
    return cy
      .xpath(this.locator._selectedDropdownValue)
      .first()
      .invoke("text");
  }

  public EnterActionValue(actionName: string, value: string, paste = true) {
    cy.xpath(this.locator._actionTextArea(actionName))
      .first()
      .scrollIntoView()
      .focus()
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}{del}", { force: true });
    cy.focused().then(($cm: any) => {
      if ($cm.contents != "") {
        cy.log("The field is not empty");
        cy.xpath(this.locator._actionTextArea(actionName))
          .first()
          .scrollIntoView()
          .click({ force: true })
          .focused()
          .clear({
            force: true,
          });
      }
      this.Sleep();
      cy.xpath(this.locator._actionTextArea(actionName))
        .first()
        .scrollIntoView()
        .then((el: any) => {
          if (paste) {
            //input.invoke("val", value);
            this.Paste(el, value);
          } else {
            cy.get(el).type(value, {
              parseSpecialCharSequences: false,
            });
          }
        });
      this.AssertAutoSave();
    });
  }

  public GetNClick(
    selector: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
  ) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator
      .eq(index)
      .scrollIntoView()
      .click({ force: force })
      .wait(waitTimeInterval);
  }

  public SelectNRemoveLineText(selector: string) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator.type(this.selectLineNRemove);
  }

  public RemoveCharsNType(selector: string, charCount = 0, totype: string) {
    if (charCount > 0)
      this.GetElement(selector)
        .focus()
        .type("{backspace}".repeat(charCount), { timeout: 2, force: true })
        .wait(50)
        .type(totype);
    else {
      if (charCount == -1) this.GetElement(selector).clear();
      this.TypeText(selector, totype);
    }
  }

  public TypeText(selector: string, value: string, index = 0) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator
      .eq(index)
      .focus()
      .type(value, {
        parseSpecialCharSequences: false,
        //delay: 3,
        //force: true,
      });
  }

  public ContainsNClick(
    text: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
  ) {
    return cy
      .contains(text)
      .eq(index)
      .click({ force: force })
      .wait(waitTimeInterval);
  }

  public GetNClickByContains(
    selector: string,
    containsText: string,
    index = 0,
  ) {
    cy.get(selector)
      .contains(containsText)
      .eq(index)
      .click()
      .wait(200);
  }

  public CheckUncheck(selector: string, check = true) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    if (check) {
      locator.check({ force: true }).should("be.checked");
    } else {
      locator.uncheck({ force: true }).should("not.be.checked");
    }
    this.Sleep();
  }

  public AssertExistingToggleState(
    propertyName: string,
    toggle: "checked" | "unchecked",
  ) {
    let locator;
    if (propertyName.startsWith("//")) {
      locator = cy.xpath(propertyName);
      locator.should("have.attr", toggle);
    } else if (propertyName.includes(" ")) {
      locator = cy.get(propertyName);
      locator.should("have.attr", toggle);
    } else {
      locator = cy.xpath(this.locator._propertyToggleValue(propertyName));
      locator.invoke("attr", "class").then((classes) => {
        expect(classes).includes(toggle);
      });
    }
  }

  public ToggleSwitch(
    switchName: string,
    toggle: "check" | "uncheck" = "check",
    jsonSwitch = false,
  ) {
    const locator = jsonSwitch
      ? cy.xpath(this.locator._jsonToggle(switchName))
      : cy.xpath(this.locator._switchToggle(switchName));
    const parentLoc = locator.parent("label");
    if (toggle == "check")
      parentLoc.then(($parent) => {
        if (!$parent.hasClass("t--switch-widget-active")) {
          locator.click();
        }
      });
    else
      parentLoc.then(($parent) => {
        if (!$parent.hasClass("t--switch-widget-inactive")) {
          locator.click();
        }
      });
  }

  // public NavigateBacktoEditor() {
  //   cy.get(this.locator._backToEditor).click();
  //   this.Sleep(2000);
  //   localStorage.setItem("inDeployedMode", "false");
  // }

  public GenerateUUID() {
    let id = uuid.v4();
    id = id.split("-")[0];
    cy.wrap(id).as("guid");
  }

  public GetObjectName() {
    //cy.get(this.locator._queryName).invoke("text").then((text) => cy.wrap(text).as("queryName")); or below syntax
    return cy.get(this.locator._queryName).invoke("text");
  }

  public GetElementLength(selector: string) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator.its("length");
  }

  public Sleep(timeout = 1000) {
    cy.wait(timeout);
  }

  public RefreshPage() {
    cy.reload();
    this.Sleep(2000);
  }

  public ActionContextMenuWithInPane(
    action: "Copy to page" | "Move to page" | "Delete" | "Prettify Code",
    subAction = "",
    jsDelete = false,
  ) {
    cy.get(this.locator._contextMenuInPane).click();
    cy.xpath(this.locator._contextMenuSubItemDiv(action))
      .should("be.visible")
      .click({ force: true });
    if (action == "Delete") {
      subAction = "Are you sure?";
    }
    if (subAction) {
      cy.xpath(this.locator._contextMenuSubItemDiv(subAction)).click({
        force: true,
      });
      this.Sleep(500);
    }
    if (action == "Delete") {
      !jsDelete && this.ValidateNetworkStatus("@deleteAction");
      jsDelete && this.ValidateNetworkStatus("@deleteJSCollection");
      jsDelete && this.AssertContains("deleted successfully");
    }
  }

  public EnterValueNValidate(valueToType: string, fieldName = "") {
    this.EnterValue(valueToType, {
      propFieldName: fieldName,
      directInput: false,
      inputFieldName: "",
    });
    this.VerifyEvaluatedValue(valueToType);
  }

  // by dynamic input value we mean QUERY_DYNAMIC_INPUT_TEXT formControls.
  public TypeDynamicInputValueNValidate(valueToType: string, fieldName = "") {
    this.EnterValue(valueToType, {
      propFieldName: fieldName,
      directInput: true,
      inputFieldName: "",
    });
    this.VerifyEvaluatedValue(valueToType);
  }

  public EnterValue(
    valueToEnter: string,
    options: IEnterValue = DEFAULT_ENTERVALUE_OPTIONS,
  ) {
    const { directInput, inputFieldName, propFieldName } = options;
    if (propFieldName && directInput && !inputFieldName) {
      cy.get(propFieldName).then(($field: any) => {
        this.UpdateCodeInput($field, valueToEnter);
      });
    } else if (inputFieldName && !propFieldName && !directInput) {
      cy.xpath(this.locator._inputFieldByName(inputFieldName)).then(
        ($field: any) => {
          this.UpdateCodeInput($field, valueToEnter);
        },
      );
    }
    this.AssertAutoSave();
  }

  public VerifyCodeInputValue(propFieldName: string, value: string) {
    cy.get(propFieldName).then(($field: any) => {
      this.CheckCodeInputValue($field, value);
    });
  }

  public BlurInput(propFieldName: string) {
    cy.get(propFieldName).then(($field: any) => {
      this.BlurCodeInput($field);
    });
  }

  public EnterInputText(
    name: string,
    input: string,
    toClear = false,
    isInput = true,
  ) {
    toClear && this.ClearInputText(name);
    cy.xpath(this.locator._inputWidgetValueField(name, isInput))
      .trigger("click")
      .type(input);
  }

  public ClearInputText(name: string, isInput = true) {
    cy.xpath(this.locator._inputWidgetValueField(name, isInput)).clear();
  }

  public UpdateCodeInput(selector: string, value: string) {
    cy.wrap(selector)
      .find(".CodeMirror")
      .find("textarea")
      .parents(".CodeMirror")
      .first()
      .then((ins: any) => {
        const input = ins[0].CodeMirror;
        input.focus();
        this.Sleep(200);
        input.setValue(value);
        this.Sleep(200);
      });
  }

  public UpdateInput(selector: string, value: string) {
    this.GetElement(selector)
      .find("input")
      .type(this.selectAll)
      .type(value, {delay: 1})
      // .type(selectAllJSObjectContentShortcut)
      // .then((ins: any) => {
      //   //const input = ins[0].input;
      //   ins.clear();
      //   this.Sleep(200);
      //   //ins.setValue(value);
      //   ins.val(value).trigger('change');
      //   this.Sleep(200);
      // });
  }

  public BlurCodeInput(selector: string) {
    cy.wrap(selector)
      .find(".CodeMirror")
      .first()
      .then((ins: any) => {
        const input = ins[0].CodeMirror;
        input.focus();
        this.Sleep(200);
        input.display.input.blur();
        this.Sleep(200);
      });
  }

  public CheckCodeInputValue(selector: string, expectedValue: string) {
    cy.wrap(selector)
      .find(".CodeMirror")
      .first()
      .then((ins: any) => {
        const input = ins[0].CodeMirror;
        const inputVal = input.getValue();
        this.Sleep(200);
        expect(inputVal).to.eq(expectedValue);
      });
  }

  public VerifyEvaluatedValue(currentValue: string) {
    this.Sleep(3000);
    cy.get(this.locator._evaluatedCurrentValue)
      .first()
      .should("be.visible")
      .should("not.have.text", "undefined");
    cy.get(this.locator._evaluatedCurrentValue)
      .first()
      .click({ force: true })
      .then(($text) => {
        if ($text.text()) expect($text.text()).to.eq(currentValue);
      })
      .trigger("mouseout")
      .then(() => {
        cy.wait(2000);
      });
  }

  public EvaluateExistingPropertyFieldValue(fieldName = "", currentValue = "") {
    let toValidate = false;
    if (currentValue) toValidate = true;
    if (fieldName) {
      cy.xpath(this.locator._existingFieldValueByName(fieldName))
        .eq(0)
        .click();
    } else {
      cy.xpath(this.locator._codeMirrorCode).click();
    }
    this.Sleep(3000); //Increasing wait time to evaluate non-undefined values
    const val = cy
      .get(this.locator._evaluatedCurrentValue)
      .first()
      .should("be.visible")
      .invoke("text");
    if (toValidate) expect(val).to.eq(currentValue);
    return val;
  }

  public UploadFile(fixtureName: string, toClickUpload = true) {
    cy.get(this.locator._uploadFiles)
      .attachFile(fixtureName)
      .wait(2000);
    toClickUpload && this.GetNClick(this.locator._uploadBtn, 0, false);
  }

  public AssertDebugError(label: string, messgae: string) {
    this.GetNClick(this.locator._debuggerIcon, 0, true, 0);
    this.GetNClick(this.locator._errorTab, 0, true, 0);
    this.GetText(this.locator._debuggerLabel, "text", 0).then(($text) => {
      expect($text).to.eq(label);
    });
    this.GetText(this.locator._debugErrorMsg, "text", 0).then(($text) => {
      expect($text).to.contains(messgae);
    });
  }

  public AssertElementAbsence(selector: ElementType, timeout = 0) {
    //Should not exists - cannot take indexes
    return this.GetElement(selector, timeout).should("not.exist");
  }

  public GetText(
    selector: ElementType,
    textOrValue: "text" | "val" = "text",
    index = 0,
  ) {
    return this.GetElement(selector)
      .eq(index)
      .invoke(textOrValue);
  }

  public AssertText(
    selector: ElementType,
    textOrValue: "text" | "val" = "text",
    expectedData: string,
    index = 0,
  ) {
    this.GetElement(selector)
      .eq(index)
      .invoke(textOrValue)
      .should("deep.equal", expectedData);
  }

  public AssertElementVisible(selector: ElementType, index = 0) {
    return this.GetElement(selector)
      .eq(index)
      .scrollIntoView()
      .should("be.visible");
  }

  public AssertElementExist(selector: ElementType, index = 0) {
    return this.GetElement(selector)
      .eq(index)
      .should("exist");
  }

  public AssertElementLength(
    selector: ElementType,
    length: number,
    index: number | null = null,
  ) {
    if (index)
      return this.GetElement(selector)
        .eq(index)
        .should("have.length", length);
    else return this.GetElement(selector).should("have.length", length);
  }

  public FocusElement(selector: ElementType) {
    this.GetElement(selector).focus();
  }

  public AssertContains(
    text: string | RegExp,
    exists: "exist" | "not.exist" = "exist",
  ) {
    return cy.contains(text).should(exists);
  }

  public GetNAssertContains(
    selector: ElementType,
    text: string | RegExp,
    exists: "exist" | "not.exist" = "exist",
  ) {
    return this.GetElement(selector)
      .contains(text)
      .should(exists);
  }

  public ScrollTo(
    selector: ElementType,
    position:
      | "topLeft"
      | "top"
      | "topRight"
      | "left"
      | "center"
      | "right"
      | "bottomLeft"
      | "bottom"
      | "bottomRight",
  ) {
    return this.GetElement(selector)
      .scrollTo(position)
      .wait(2000);
  }

  public EnableAllEditors() {
    this.Sleep(2000);
    cy.get("body").then(($body: any) => {
      if ($body.get(this.locator._codeEditorWrapper)?.length > 0) {
        let count = $body.get(this.locator._codeEditorWrapper)?.length || 0;
        while (count) {
          $body
            .get(this.locator._codeEditorWrapper)
            ?.eq(0)
            .then(($el: any) => $el.click({ force: true }).wait(100));
          count = $body.find(this.locator._codeEditorWrapper)?.length || 0;
        }
      }
    });
    this.Sleep();
  }

  //Not used:
  // private xPathToCss(xpath: string) {
  //     return xpath
  //         .replace(/\[(\d+?)\]/g, function (s, m1) { return '[' + (m1 - 1) + ']'; })
  //         .replace(/\/{2}/g, '')
  //         .replace(/\/+/g, ' > ')
  //         .replace(/@/g, '')
  //         .replace(/\[(\d+)\]/g, ':eq($1)')
  //         .replace(/^\s+/, '');
  // }

  // Cypress.Commands.add("byXpath", (xpath) => {
  //     const iterator = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)
  //     const items = [];
  //     let item = iterator.iterateNext();
  //     while (item) {
  //         items.push(item);
  //         item = iterator.iterateNext();
  //     }
  //     return items;
  //   }, { timeout: 5000 });
}
