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
  public isMac = Cypress.platform === "darwin";
  private selectLine = `${
    this.isMac ? "{cmd}{shift}{leftArrow}" : "{shift}{home}"
  }`;
  private removeLine = "{backspace}";
  private selectAll = `${this.isMac ? "{cmd}{a}" : "{ctrl}{a}"}`;

  private selectChars = (noOfChars: number) =>
    `${"{leftArrow}".repeat(noOfChars) + "{shift}{cmd}{leftArrow}{backspace}"}`;

  // Chrome asks for permission to add text to clipboard on cypress, we grant it here.
  public GiveChromeCopyPermission() {
    cy.wrap(
      Cypress.automation("remote:debugger:protocol", {
        command: "Browser.grantPermissions",
        params: {
          permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
          origin: window.location.origin,
        },
      }),
    );
  }

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
    let pageid: string, layoutId;
    const appId: string | null = localStorage.getItem("applicationId");
    cy.url().then((url) => {
      pageid = url.split("/")[5]?.split("-").pop() as string;
      cy.log(pageid + "page id");
      //Fetch the layout id
      cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
        const respBody = JSON.stringify(response.body);
        layoutId = JSON.parse(respBody).data.layouts[0].id;
        // Dumping the DSL to the created page
        cy.request(
          "PUT",
          "api/v1/layouts/" +
            layoutId +
            "/pages/" +
            pageid +
            "?applicationId=" +
            appId,
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

  public RenameWithInPane(renameVal: string, IsQuery = true) {
    const name = IsQuery ? this.locator._queryName : this.locator._dsName;
    const text = IsQuery ? this.locator._queryNameTxt : this.locator._dsNameTxt;
    this.GetNClick(name, 0, true);
    cy.get(text)
      .clear({ force: true })
      .type(renameVal, { force: true, delay: 0 })
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

  public CheckForPageSaveError() {
    // Wait for "saving" status to disappear
    this.GetElement(this.locator._statusSaving, 30000).should("not.exist");
    // Check for page save error
    cy.get("body").then(($ele) => {
      if ($ele.find(this.locator._saveStatusError).length) {
        this.RefreshPage();
        return false;
      }
    });
    return true;
  }

  public AssertAutoSave() {
    let saveStatus = this.CheckForPageSaveError();
    // wait for save query to trigger & n/w call to finish occuring
    if (!saveStatus)
      cy.get(this.locator._saveStatusContainer, { timeout: 30000 }).should(
        "not.exist",
      ); //adding timeout since waiting more time is not worth it!

    //this.ValidateNetworkStatus("@sucessSave", 200);
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
      locator =
        selector.startsWith("//") || selector.startsWith("(//")
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
      this.GetElement(selector).eq(index).should(textPresence, text);
    else this.GetElement(selector).should(textPresence, text);
  }

  public ValidateToastMessage(text: string, index = 0, length = 1) {
    this.GetElement(this.locator._toastMsg)
      .should("have.length.at.least", length)
      .eq(index)
      .should("contain.text", text);
  }

  public ClickButton(
    btnVisibleText: string,
    index = 0,
    shouldSleep = true,
    force = true,
  ) {
    cy.xpath(this.locator._spanButton(btnVisibleText))
      .eq(index)
      .scrollIntoView()
      .click({ force: force });
    shouldSleep && this.Sleep();
  }

  public clickMultipleButtons(btnVisibleText: string, shouldSleep = true) {
    cy.xpath(this.locator._spanButton(btnVisibleText)).each(($el) => {
      $el.trigger("click", { force: true });
      cy.wait(200);
    });
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
    const locator = selector.includes("//")
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
      ($ele) => cy.wrap($ele).children().should("have.length", 0),
      {
        errorMsg: "Toasts did not disappear even after 10 seconds",
        timeout: 10000,
        interval: 1000,
      },
    );
  }

  public WaitUntilEleAppear(selector: string) {
    const locator = selector.includes("//")
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

  public ValidateNetworkStatus(
    aliasName: string,
    expectedStatus = 200,
    timeout = 20000,
  ) {
    cy.wait(aliasName, { timeout: timeout }).should(
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

  public SelectFromMutliTree(dropdownOption: string) {
    this.GetNClick(this.locator._dropDownMultiTreeSelect);
    this.GetNClick(this.locator._dropDownMultiTreeValue(dropdownOption));
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
    cy.xpath(finalSelector).eq(index).scrollIntoView().click();
    cy.get(this.locator._dropDownValue(dropdownOption)).click({ force: true });
    this.Sleep(); //for selected value to reflect!
  }

  public SelectDropdownList(ddName: string, dropdownOption: string) {
    this.GetNClick(this.locator._existingFieldTextByName(ddName));
    cy.get(this.locator._dropdownText).contains(dropdownOption).click();
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

  public PressEnter() {
    cy.get("body").type("{enter}");
  }

  public PressDelete() {
    cy.get("body").type(`{del}`, { force: true });
  }

  public RemoveMultiSelectItems(items: string[]) {
    items.forEach(($each) => {
      cy.xpath(this.locator._multiSelectItem($each))
        .eq(0)
        .click({ force: true })
        .wait(1000);
    });
  }

  public ReadSelectedDropDownValue() {
    return cy.xpath(this.locator._selectedDropdownValue).first().invoke("text");
  }

  public EnterActionValue(
    actionName: string,
    value: string,
    paste = true,
    index = 0,
  ) {
    cy.xpath(this.locator._actionTextArea(actionName))
      .eq(index)
      .scrollIntoView()
      .focus()
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}{del}", { force: true });
    cy.focused().then(($cm: any) => {
      if ($cm.contents != "") {
        cy.log("The field is not empty");
        cy.xpath(this.locator._actionTextArea(actionName))
          .eq(index)
          .scrollIntoView()
          .click({ force: true })
          .focused()
          .clear({
            force: true,
          });
      }
      this.Sleep();
      cy.xpath(this.locator._actionTextArea(actionName))
        .eq(index)
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

  public VerifyCallCount(alias: string, expectedNumberOfCalls: number) {
    cy.wait(alias);
    cy.get(`${alias}.all`).should("have.length", expectedNumberOfCalls);
  }

  public GetNClick(
    selector: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
  ) {
    return this.GetElement(selector)
      .eq(index)
      .scrollIntoView()
      .click({ force: force })
      .wait(waitTimeInterval);
  }

  public GetSiblingNClick(
    selector: string,
    siblingSelector: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
  ) {
    return this.GetElement(selector)
      .siblings(siblingSelector)
      .first()
      .eq(index)
      .scrollIntoView()
      .click({ force: force })
      .wait(waitTimeInterval);
  }

  public GoBack() {
    this.GetNClick(this.locator._visibleTextSpan("Back"));
  }

  public SelectNRemoveLineText(selector: string) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    locator.type(this.selectLine);
    return locator.type(this.removeLine);
  }

  public SelectAllRemoveCodeText(selector: string) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator.type(this.selectAll + "{del}");
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

  public ClearTextField(selector: string) {
    this.GetElement(selector).clear();
  }

  public TypeText(
    selector: string,
    value: string,
    index = 0,
    parseSpecialCharSeq = false,
  ) {
    const locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator.eq(index).focus().wait(100).type(value, {
      parseSpecialCharSequences: parseSpecialCharSeq,
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
      .click({ force: true })
      .wait(500);
  }

  public CheckUncheck(selector: string, check = true) {
    if (check) {
      this.GetElement(selector).check({ force: true }).should("be.checked");
    } else {
      this.GetElement(selector)
        .uncheck({ force: true })
        .should("not.be.checked");
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

  public AssertAttribute(
    selector: string,
    attribName: string,
    attribValue: string,
  ) {
    return this.GetElement(selector).should(
      "have.attr",
      attribName,
      attribValue,
    );
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
  public TypeDynamicInputValueNValidate(
    valueToType: string,
    fieldName = "",
    isDynamicValue = false,
    evaluatedValue = valueToType,
  ) {
    this.EnterValue(valueToType, {
      propFieldName: fieldName,
      directInput: true,
      inputFieldName: "",
    });
    if (!isDynamicValue) {
      this.AssertElementAbsence(this.locator._evaluatedCurrentValue);
    } else {
      this.VerifyEvaluatedValue(evaluatedValue);
    }
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
      .type(input, { parseSpecialCharSequences: false });
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
    this.Sleep(500); //for value set to settle
  }

  public UpdateInput(selector: string, value: string) {
    this.GetElement(selector)
      .find("input")
      .clear()
      //.type(this.selectAll)
      .type(value, { delay: 1, parseSpecialCharSequences: false });
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

  public UpdateFieldLongInput(selector: string, value: string) {
    this.GetElement(selector)
      .find("input")
      .invoke("attr", "value", value)
      .trigger("input");
    this.Sleep(); //for value set to settle
  }

  public UpdateTextArea(selector: string, value: string) {
    this.GetElement(selector)
      .find("textarea")
      .first()
      .invoke("val", value)
      .trigger("input");
    this.Sleep(500); //for value set to settle
  }

  public TypeIntoTextArea(selector: string, value: string) {
    this.GetElement(selector)
      .find("textarea")
      .first()
      .type(value, { delay: 0, force: true, parseSpecialCharSequences: false });
    this.Sleep(500); //for value set to settle
  }

  public UpdateInputValue(selector: string, value: string) {
    this.GetElement(selector)
      .closest("input")
      //.type(this.selectAll)
      .type(value, { delay: 0 });
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

  public FocusCodeInput(selector: string) {
    cy.wrap(selector)
      .find(".CodeMirror")
      .first()
      .then((ins: any) => {
        const input = ins[0].CodeMirror;
        input.focus();
        this.Sleep(200);
        // input.display.input.blur();
        // this.Sleep(200);
      });
  }

  DragEvaluatedValuePopUp(x: number, y: number) {
    cy.get(this.locator._evaluatedCurrentValue)
      .first()
      .should("be.visible")
      .realHover({ pointer: "mouse" });
    cy.get(this.locator._evaluatedValuePopDragHandler)
      .trigger("mousedown", { which: 1 })
      .trigger("mousemove", { clientX: x, clientY: y })
      .trigger("mouseup", { force: true });
  }

  public FocusAndDragEvaluatedValuePopUp(
    options: IEnterValue = DEFAULT_ENTERVALUE_OPTIONS,
    x = 0,
    y = 0,
  ) {
    const { directInput, inputFieldName, propFieldName } = options;
    if (propFieldName && directInput && !inputFieldName) {
      cy.get(propFieldName).then(($field: any) => {
        this.FocusCodeInput($field);
        this.DragEvaluatedValuePopUp(x, y);
      });
    } else if (inputFieldName && !propFieldName && !directInput) {
      cy.xpath(this.locator._inputFieldByName(inputFieldName)).then(
        ($field: any) => {
          this.FocusCodeInput($field);
          this.DragEvaluatedValuePopUp(x, y);
        },
      );
    }
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

  public ReturnCodeInputValue(selector: string) {
    let inputVal = "";
    this.GetElement(selector).then(($field) => {
      cy.wrap($field)
        .find(".CodeMirror-code span")
        .first()
        .invoke("text")
        .then((text1) => {
          inputVal = text1;
        });
    });
    //if (currentValue) expect(val).to.eq(currentValue);
    // to be chained with another cy command.
    return cy.wrap(inputVal);

    // cy.xpath(this.locator._existingFieldValueByName(selector)).then(
    //   ($field: any) => {
    //     cy.wrap($field)
    //       .find(".CodeMirror")
    //       .first()
    //       .then((ins: any) => {
    //         const input = ins[0].CodeMirror;
    //         inputVal = input.getValue();
    //         this.Sleep(200);
    //       });

    //     // to be chained with another cy command.
    //     return inputVal;
    //   },
    // );
  }

  public VerifyEvaluatedErrorMessage(errorMessage: string) {
    cy.get(this.locator._evaluatedErrorMessage)
      .should("be.visible")
      .should("have.text", errorMessage);
  }

  // this should only be used when we want to verify the evaluated value of dynamic bindings for example {{Api1.data}} or {{"asa"}}
  // and should not be called for plain strings
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

  public UploadFile(fixtureName: string, toClickUpload = true) {
    cy.get(this.locator._uploadFiles).attachFile(fixtureName).wait(2000);
    toClickUpload && this.GetNClick(this.locator._uploadBtn, 0, false);
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
    return this.GetElement(selector).eq(index).invoke(textOrValue);
  }

  AssertHeight(selector: ElementType, height: number) {
    return this.GetElement(selector)
      .invoke("height")
      .should("be.equal", height);
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

  public AssertElementFocus(selector: ElementType, isFocused = true) {
    if (isFocused) return this.GetElement(selector).should("be.focused");
    return this.GetElement(selector).should("not.be.focused");
  }

  public AssertElementVisible(selector: ElementType, index = 0) {
    return this.GetElement(selector)
      .eq(index)
      .scrollIntoView()
      .should("be.visible");
  }

  public CheckForErrorToast(error: string) {
    cy.get("body").then(($ele) => {
      if ($ele.find(this.locator._toastMsg).length) {
        if ($ele.find(this.locator._specificToast(error)).length) {
          throw new Error("Error Toast from Application:" + error);
        }
      }
    });
  }

  public AssertElementExist(selector: ElementType, index = 0, timeout = 20000) {
    return this.GetElement(selector, timeout).eq(index).should("exist");
  }

  public AssertElementLength(
    selector: ElementType,
    length: number,
    index: number | null = null,
  ) {
    if (index)
      return this.GetElement(selector).eq(index).should("have.length", length);
    else return this.GetElement(selector).should("have.length", length);
  }

  public FocusElement(selector: ElementType) {
    this.GetElement(selector).focus();
  }

  public AssertContains(
    text: string | RegExp,
    exists: "exist" | "not.exist" | "be.visible" = "exist",
    selector?: string,
  ) {
    if (selector) {
      return cy.contains(selector, text).should(exists);
    }
    return cy.contains(text).should(exists);
  }

  public GetNAssertContains(
    selector: ElementType,
    text: string | number | RegExp,
    exists: "exist" | "not.exist" = "exist",
    index?: number,
    timeout?: number,
  ) {
    if (index)
      return this.GetElement(selector, timeout)
        .eq(index)
        .contains(text)
        .should(exists);
    else
      return this.GetElement(selector, timeout).contains(text).should(exists);
  }

  public ValidateURL(url: string) {
    cy.url().should("include", url);
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
    return this.GetElement(selector).scrollTo(position).wait(2000);
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

  public AssertElementEnabledDisabled(
    selector: ElementType,
    index = 0,
    disabled = true,
  ) {
    if (disabled) {
      return this.GetElement(selector).eq(index).should("be.disabled");
    } else {
      return this.GetElement(selector).eq(index).should("not.be.disabled");
    }
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
