import "cypress-wait-until";
const uuid = require("uuid");
import { ObjectsRegistry } from "../Objects/Registry";

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

  public saveLocalStorageCache() {
    Object.keys(localStorage).forEach((key) => {
      LOCAL_STORAGE_MEMORY[key] = localStorage[key];
    });
  }

  public restoreLocalStorageCache() {
    Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
      localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
    });
  }

  public clearLocalStorageCache() {
    localStorage.clear();
    LOCAL_STORAGE_MEMORY = {};
  }

  public TypeTab(shiftKey: boolean = false, ctrlKey: boolean = false) {
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
    let currentURL;
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
    let name = query ? this.locator._queryName : this.locator._dsName;
    let text = query ? this.locator._queryNameTxt : this.locator._dsNameTxt;
    cy.get(name).click({ force: true });
    cy.get(text)
      .clear({ force: true })
      .type(renameVal, { force: true })
      .should("have.value", renameVal)
      .blur();
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

  public ValidateToastMessage(text: string, length = 1) {
    cy.get(this.locator._toastMsg)
      .should("have.length", length)
      .should("contain.text", text);
  }

  public ClickButton(btnVisibleText: string, index = 0) {
    cy.xpath(this.locator._spanButton(btnVisibleText))
      .eq(index)
      .scrollIntoView()
      .click({ force: true });
    this.Sleep();
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

  public WaitUntilToastDisappear(msgToCheckforDisappearance: string | "") {
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

  public WaitUntilEleDisappear(
    selector: string,
    msgToCheckforDisappearance: string | "",
  ) {
    cy.waitUntil(
      () => (selector.includes("//") ? cy.xpath(selector) : cy.get(selector)),
      {
        errorMsg: msgToCheckforDisappearance + " did not disappear",
        timeout: 5000,
        interval: 1000,
      },
    ).then(($ele) => {
      cy.wrap($ele)
        .contains(msgToCheckforDisappearance)
        .should("have.length", 0);
      this.Sleep();
    });
  }

  public WaitUntilEleAppear(selector: string) {
    // cy.waitUntil(() => cy.get(selector, { timeout: 50000 }).should("have.length.greaterThan", 0),
    //     {
    //         errorMsg: "Element did not appear",
    //         timeout: 5000,
    //         interval: 1000
    //     }).then(() => this.Sleep(500))

    cy.waitUntil(
      () => (selector.includes("//") ? cy.xpath(selector) : cy.get(selector)),
      {
        errorMsg: "Element did not appear",
        timeout: 5000,
        interval: 1000,
      },
    ).then(($ele) => {
      cy.wrap($ele)
        .eq(0)
        .should("be.visible");
      this.Sleep();
    });
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

  public SelectPropertiesDropDown(endp: string, ddOption: string) {
    cy.xpath(this.locator._selectPropDropdown(endp))
      .first()
      .scrollIntoView()
      .click();
    cy.get(this.locator._dropDownValue(ddOption)).click();
  }

  public SelectDropDown(ddOption: string, endp: string = "selectwidget") {
    let mode = window.localStorage.getItem("inDeployedMode");
    if (mode == "false") {
      cy.xpath(this.locator._selectWidgetDropdown(endp))
        .first()
        .scrollIntoView()
        .click();
    } else {
      cy.xpath(this.locator._selectWidgetDropdownInDeployed(endp))
        .first()
        .scrollIntoView()
        .click();
    }
    if (endp == "selectwidget")
      cy.get(this.locator._selectOptionValue(ddOption)).click({ force: true });
    else cy.get(this.locator._dropDownValue(ddOption)).click({ force: true });

    this.Sleep(); //for selected value to reflect!
  }

  public SelectFromDropDown(
    ddOption: string,
    insideParent: string = "",
    index = 0,
    endp: string = "dropdownwidget",
  ) {
    let mode = window.localStorage.getItem("inDeployedMode");
    //cy.log("mode frm deployed is:" + mode)
    let modeSelector =
      mode == "true"
        ? this.locator._selectWidgetDropdownInDeployed(endp)
        : this.locator._selectWidgetDropdown(endp);
    let finalSelector = insideParent
      ? this.locator._divWithClass(insideParent) + modeSelector
      : modeSelector;
    cy.log(finalSelector);
    cy.xpath(finalSelector)
      .eq(index)
      .scrollIntoView()
      .click();
    cy.get(this.locator._dropDownValue(ddOption)).click({ force: true });
    this.Sleep(); //for selected value to reflect!
  }

  public SelectDropdownList(ddName: string, ddOption: string) {
    this.GetNClick(this.locator._existingFieldTextByName(ddName));
    cy.get(this.locator._dropdownText)
      .contains(ddOption)
      .click();
  }

  public SelectFromMultiSelect(
    options: string[],
    index = 0,
    check = true,
    endp: string = "multiselectwidgetv2",
  ) {
    cy.get(this.locator._widgetInDeployed(endp) + " div.rc-select-selector")
      .eq(index)
      .scrollIntoView()
      .click();

    if (check) {
      options.forEach(($each) => {
        cy.get(this.locator._multiSelectOptions($each))
          .check({ force: true })
          .wait(800)
          .should("be.checked");
      });
    } else {
      options.forEach(($each) => {
        cy.get(this.locator._multiSelectOptions($each))
          .uncheck({ force: true })
          .wait(800)
          .should("not.be.checked");
      });
    }

    // //closing multiselect dropdown
    cy.get("body").type("{esc}");
    // cy.get(this.locator._widgetInDeployed(endp))
    //     .eq(index)
    //     .click()
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
      .focus()
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}{del}", { force: true });
    cy.focused().then(($cm: any) => {
      if ($cm.contents != "") {
        cy.log("The field is not empty");
        cy.xpath(this.locator._actionTextArea(actionName))
          .first()
          .click({ force: true })
          .focused()
          .clear({
            force: true,
          });
      }
      this.Sleep();
      cy.xpath(this.locator._actionTextArea(actionName))
        .first()
        .then((el: any) => {
          const input = cy.get(el);
          if (paste) {
            //input.invoke("val", value);
            this.Paste(el, value);
          } else {
            input.type(value, {
              parseSpecialCharSequences: false,
            });
          }
        });
      this.AssertAutoSave();
    });
  }

  public GetNClick(selector: string, index = 0) {
    let locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator
      .eq(index)
      .click()
      .wait(500);
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

  public ToggleOnOrOff(propertyName: string, toggle: "On" | "Off") {
    if (toggle == "On") {
      cy.get(this.locator._propertyToggle(propertyName))
        .check({ force: true })
        .should("be.checked");
    } else {
      cy.get(this.locator._propertyToggle(propertyName))
        .uncheck({ force: true })
        .should("not.be.checked");
    }
    this.AssertAutoSave();
  }

  public CheckUncheck(selector: string, check = true) {
    let locator = selector.startsWith("//")
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

  public NavigateBacktoEditor() {
    cy.get(this.locator._backToEditor).click();
    this.Sleep(2000);
    localStorage.setItem("inDeployedMode", "false");
  }

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
    let locator = selector.startsWith("//")
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
    action: "Copy to page" | "Move to page" | "Delete",
    subAction = "",
  ) {
    cy.get(this.locator._contextMenuInPane).click();
    cy.xpath(this.locator._visibleTextDiv(action))
      .should("be.visible")
      .click();
    if (action == "Delete") {
      cy.xpath(this.locator._visibleTextDiv("Are you sure?")).click();
      this.ValidateNetworkStatus("@deleteAction");
    }
    if (subAction) {
      cy.xpath(this.locator._visibleTextDiv(subAction)).click();
      this.Sleep(500);
    }
  }

  public TypeValueNValidate(valueToType: string, fieldName = "") {
    this.EnterValue(valueToType, {
      propFieldName: fieldName,
      directInput: false,
      inputFieldName: "",
    });
    this.VerifyEvaluatedValue(valueToType);
  }

  public EnterValue(
    valueToEnter: string,
    options: IEnterValue = DEFAULT_ENTERVALUE_OPTIONS,
  ) {
    const { propFieldName, directInput, inputFieldName } = options;

    if (propFieldName && !directInput && !inputFieldName) {
      cy.xpath(this.locator._existingFieldTextByName(propFieldName)).then(
        ($field: any) => {
          this.UpdateCodeInput($field, valueToEnter);
        },
      );
    } else if (propFieldName && directInput && !inputFieldName) {
      cy.get(propFieldName).then(($field: any) => {
        this.UpdateCodeInput($field, valueToEnter);
      });
    } else if (inputFieldName && !propFieldName && !directInput) {
      cy.xpath(this.locator._inputFieldByName(propFieldName)).then(
        ($field: any) => {
          this.UpdateCodeInput($field, valueToEnter);
        },
      );
    } else {
      cy.get(this.locator._codeEditorTarget).then(($field: any) => {
        this.UpdateCodeInput($field, valueToEnter);
      });
    }
    this.AssertAutoSave();
  }

  public UpdateCodeInput(selector: string, value: string) {
    cy.wrap(selector)
      .find(".CodeMirror")
      .first()
      .then((ins: any) => {
        const input = ins[0].CodeMirror;
        input.focus();
        this.Sleep(200);
        input.setValue(value);
        this.Sleep(200);
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

  public UploadFile(fixtureName: string, execStat = true) {
    cy.get(this.locator._uploadFiles)
      .attachFile(fixtureName)
      .wait(2000);
    cy.get(this.locator._uploadBtn)
      .click()
      .wait(3000);
    this.ValidateNetworkExecutionSuccess("@postExecute", execStat);
  }

  public AssertDebugError(label: string, messgae: string) {
    cy.get(this.locator._debuggerIcon)
      .should("be.visible")
      .click({ force: true });
    cy.get(this.locator._errorTab)
      .should("be.visible")
      .click({ force: true });
    cy.get(this.locator._debuggerLabel)
      .eq(0)
      .invoke("text")
      .then(($text) => {
        expect($text).to.eq(label);
      });
    cy.get(this.locator._debugErrorMsg)
      .eq(0)
      .invoke("text")
      .then(($text) => {
        expect($text).contains(messgae);
      });
  }

  public AssertElementAbsence(selector: string) {
    //Should not exists - cannot take indexes
    let locator = selector.startsWith("//")
      ? cy.xpath(selector, { timeout: 0 })
      : cy.get(selector, { timeout: 0 });
    locator.should("not.exist");
  }

  public GetText(
    selector: string,
    textOrValue: "text" | "val" = "text",
    index = 0,
  ) {
    let locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    return locator.eq(index).invoke(textOrValue);
  }

  public AssertElementVisible(selector: string, index = 0) {
    let locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    locator.eq(index).should("be.visible");
  }

  public AssertElementExist(selector: string, index = 0) {
    let locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    locator.eq(index).should("exist");
  }

  public AssertElementLength(
    selector: string,
    length: number,
    index: number | null = null,
  ) {
    let locator = selector.startsWith("//")
      ? cy.xpath(selector)
      : cy.get(selector);
    if (index) locator.eq(index).should("have.length", length);
    else locator.should("have.length", length);
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
