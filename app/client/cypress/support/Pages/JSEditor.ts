import { ObjectsRegistry } from "../Objects/Registry";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
  PagePaneSegment,
} from "./EditorNavigation";
import { PluginEditorToolbar } from "./IDE/PluginEditorToolbar";

export interface ICreateJSObjectOptions {
  paste: boolean;
  completeReplace: boolean;
  toRun: boolean;
  shouldCreateNewJSObj: boolean;
  lineNumber?: number;
  prettify?: boolean;
  isPackages?: boolean;
}

const DEFAULT_CREATE_JS_OBJECT_OPTIONS = {
  paste: true,
  completeReplace: false,
  toRun: true,
  shouldCreateNewJSObj: true,
  lineNumber: 4,
  prettify: true,
};

export class JSEditor {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  public ee = ObjectsRegistry.EntityExplorer;
  public propPane = ObjectsRegistry.PropertyPane;
  private assertHelper = ObjectsRegistry.AssertHelper;
  public runButtonLocator = "[data-testid='t--run-js-action']";
  public settingsTriggerLocator = "[data-testid='t--js-settings-trigger']";
  public contextMenuTriggerLocator = "[data-testid='t--more-action-trigger']";
  public runFunctionSelectLocator = "[data-testid='t--js-function-run']";
  public listOfJsDismissibleTabs =
    "[data-testid='t--tabs-container'] .editor-tab";

  public toolbar = new PluginEditorToolbar(
    this.runButtonLocator,
    this.settingsTriggerLocator,
    this.contextMenuTriggerLocator,
    this.runFunctionSelectLocator,
  );

  _codeTab = "//span[text()='Code']/parent::button";
  private _jsObjectParseErrorCallout =
    "div.t--js-response-parse-error-call-out";

  private _runBehaviourSwitch = (functionName: string) =>
    `.${functionName}-run-behavior-setting
    input[role="combobox"]`;
  private __runBehaviourSwitchStatus = (functionName: string) =>
    `.${functionName}-run-behavior-setting .rc-select-selection-item`;

  public _jsObjName = this.locator._activeEntityTab;
  public _jsObjTxt = this.locator._activeEntityTabInput;
  public _newJSobj = "span:contains('New JS object')";
  private _bindingsClose = ".t--entity-property-close";
  public _propertyList = ".binding";
  _dialog = (dialogHeader: string) =>
    "//div[@role='dialog']//h3[contains(text(), '" + dialogHeader + "')]";
  _dialogBody = (jsFuncName: string) =>
    "//div[@role='dialog']//*[contains(text(), '" +
    Cypress.env("MESSAGES")?.QUERY_CONFIRMATION_MODAL_MESSAGE() +
    "')]//*[contains(text(),'" +
    jsFuncName +
    "')]";
  _dialogInDeployView =
    "//div[@role='dialog']//*[contains(text(), '" +
    Cypress.env("MESSAGES")?.QUERY_CONFIRMATION_MODAL_MESSAGE() +
    "')]";
  _funcDropdownValue = `${this.runFunctionSelectLocator} .ads-v2-button__content-children`;
  _funcDropdownOptions =
    "[data-testid='t--js-functions-menu'] [role='menuitem'] > span > span";
  _getJSFunctionSettingsId = (JSFunctionName: string) =>
    `${JSFunctionName}-settings`;
  _asyncJSFunctionSettings = `.t--async-js-function-settings`;
  _editor = ".js-editor";
  _debugCTA = `button.js-editor-debug-cta`;
  _lineinJsEditor = (lineNumber: number) =>
    ":nth-child(" + lineNumber + ") > .CodeMirror-line";
  _lineinPropertyPaneJsEditor = (lineNumber: number, selector = "") =>
    `${
      selector ? `${selector} ` : ""
    }.CodeMirror-line:nth-child(${lineNumber})`;
  _logsTab = "[data-testid=t--tab-LOGS_TAB]";
  _confirmationModalBtns = (text: string) =>
    "//div[@data-testid='t--query-run-confirmation-modal']//span[text()='" +
    text +
    "']";
  _addJSObj = '[data-testid="t--ide-tabs-add-button"]';
  _jsPageActions = ".entity-context-menu";
  _moreActions = '[data-testid="t--more-action-trigger"]';
  _dropdownOption = ".rc-select-item-option-content";
  //#endregion

  //#region constants
  private isMac = Cypress.platform === "darwin";
  private selectAllJSObjectContentShortcut = `${
    this.isMac ? "{cmd}{a}" : "{ctrl}{a}"
  }`;
  //#endregion

  // Pastes or types content into field
  private HandleJsContentFilling(toPaste: boolean, JSCode: string, el: any) {
    if (toPaste) {
      this.agHelper.Paste(el, JSCode);
    } else {
      cy.get(el).type(JSCode, {
        parseSpecialCharSequences: false,
        delay: 40,
        force: true,
      });
    }
  }

  //#region Page functions
  public NavigateToNewJSEditor() {
    this.agHelper.ClickOutside(); //to enable click of below!
    AppSidebar.navigate(AppSidebarButton.Editor);
    PageLeftPane.switchSegment(PagePaneSegment.JS);
    PageLeftPane.switchToAddNew();

    this.agHelper.RemoveUIElement(
      "Tooltip",
      Cypress.env("MESSAGES").ADD_QUERY_JS_TOOLTIP(),
    );
    //Checking JS object was created successfully
    this.assertHelper.AssertNetworkStatus("@createNewJSCollection", 201);
    this.agHelper.AssertElementAbsence(this._jsObjTxt);

    this.agHelper.Sleep();
  }

  public CreateJSObject(
    JSCode: string,
    options: Partial<ICreateJSObjectOptions> = {},
  ) {
    const {
      completeReplace,
      isPackages,
      lineNumber,
      paste,
      prettify,
      shouldCreateNewJSObj,
      toRun,
    } = { ...DEFAULT_CREATE_JS_OBJECT_OPTIONS, ...options };

    shouldCreateNewJSObj && this.NavigateToNewJSEditor();
    if (!completeReplace) {
      const downKeys = "{downarrow}".repeat(lineNumber);
      cy.get(this.locator._codeMirrorTextArea)
        .first()
        .focus()
        .type(`${downKeys}  `)
        .then((el: any) => {
          this.HandleJsContentFilling(paste, JSCode, el);
        });
    } else {
      cy.get(this.locator._codeMirrorTextArea)
        .first()
        .focus()
        .type(this.selectAllJSObjectContentShortcut)
        .then((el: any) => {
          this.HandleJsContentFilling(paste, JSCode, el);
        });
    }

    this.agHelper.AssertAutoSave();
    if (prettify) {
      this.agHelper.ActionContextMenuWithInPane({ action: "Prettify code" });
      this.agHelper.AssertAutoSave();
    }

    if (toRun) {
      // Wait for JSObject parsing to get complete
      this.agHelper.Sleep(2000);
      //clicking 1 times & waits for 2 second for result to be populated!
      Cypress._.times(1, () => {
        this.toolbar.clickRunButton();
        this.agHelper.Sleep(2000);
      });
      cy.get(this.locator._empty).should("not.exist");
    }
    if (!isPackages) {
      this.GetJSObjectName();
    }
  }

  //Edit the name of a JSObject's property (variable or function)
  public EditJSObj(
    newContent: string,
    toPrettify = true,
    toVerifyAutoSave = true,
  ) {
    cy.get(this.locator._codeMirrorTextArea)
      .first()
      .focus()
      .type(this.selectAllJSObjectContentShortcut, { force: true })
      .then((el: JQuery<HTMLElement>) => {
        this.agHelper.Paste(el, newContent);
      });
    this.agHelper.Sleep(2000); //Settling time for edited js code
    toPrettify &&
      this.agHelper.ActionContextMenuWithInPane({ action: "Prettify code" });
    toVerifyAutoSave && this.agHelper.AssertAutoSave();
  }

  public ClearJSObj() {
    cy.get(this.locator._codeMirrorTextArea)
      .first()
      .focus()
      .type(this.selectAllJSObjectContentShortcut, { force: true })
      .type("{backspace}", { force: true });
    this.agHelper.Sleep(2000); //Settling time for edited js code
    this.agHelper.AssertAutoSave();
  }

  public RunJSObj() {
    this.toolbar.clickRunButton();
    this.agHelper.Sleep(); //for function to run
    this.agHelper.AssertElementAbsence(this.locator._btnSpinner, 15000);
    this.agHelper.AssertElementAbsence(this.locator._empty, 5000);
  }

  public RenameJSObjFromPane(renameVal: string) {
    cy.get(this._jsObjName).dblclick({ force: true });
    cy.get(this._jsObjTxt)
      .clear()
      .type(renameVal, { force: true })
      .should("have.value", renameVal)
      .blur();
    PageLeftPane.assertPresence(renameVal);
  }

  public RenameJSObjectFromContextMenu(renameVal: string) {
    cy.get(this.contextMenuTriggerLocator).click();
    cy.contains("Rename").should("be.visible").click();
    cy.get(this._jsObjTxt).clear().type(renameVal, { force: true }).blur();
    PageLeftPane.assertPresence(renameVal);
  }

  public DeleteJSObjectFromContextMenu() {
    cy.get(this.contextMenuTriggerLocator).click();
    cy.contains("Delete").should("be.visible").click();
    cy.contains("Are you sure?").should("be.visible").click();
  }

  public RenameJSObjFromExplorer(entityName: string, renameVal: string) {
    this.ee.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: entityName,
      action: "Rename",
    });
    cy.get(this.locator._entityNameEditing)
      .clear()
      .type(renameVal + "{enter}");
    PageLeftPane.assertPresence(renameVal);
  }

  public GetJSObjectName() {
    cy.get(this._jsObjName)
      .invoke("text")
      .then((text) => cy.wrap(text).as("jsObjName"));
  }

  public ValidateDefaultJSObjProperties(jsObjName: string) {
    this.ee.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: jsObjName,
      action: "Show bindings",
    });
    cy.get(this._propertyList).then(function ($lis) {
      const bindingsLength = $lis.length;
      expect(bindingsLength).to.be.at.least(4);
      const expectedTexts = [
        "{{" + jsObjName + ".myFun2()}}",
        "{{" + jsObjName + ".myFun1()}}",
        "{{" + jsObjName + ".myVar1}}",
        "{{" + jsObjName + ".myVar2}}",
        "{{" + jsObjName + ".myFun2.data}}",
        "{{" + jsObjName + ".myFun1.data}}",
      ];

      let foundMatch = false;
      for (let i = 0; i < bindingsLength; i++) {
        const text = $lis.eq(i).text();
        if (expectedTexts.includes(text)) {
          foundMatch = true;
          break;
        }
      }
      expect(foundMatch).to.be.true;
    });
    cy.get(this._bindingsClose).click({ force: true });
  }

  public VerifyAsyncFuncSettings(
    funName: string,
    runBehavior: "On page load" | "Manual",
  ) {
    this.toolbar.toggleSettings();
    this.agHelper.GetNAssertContains(
      this.__runBehaviourSwitchStatus(funName),
      runBehavior,
    );
    this.toolbar.toggleSettings();
  }

  public EnableDisableAsyncFuncSettings(
    funName: string,
    runBehavior: "On page load" | "Manual",
  ) {
    // Navigate to Settings tab
    this.toolbar.toggleSettings();
    // Set runBehavior to On page load
    this.agHelper.GetNClick(this._runBehaviourSwitch(funName));
    this.agHelper.GetNClickByContains(
      this._dropdownOption,
      runBehavior,
      0,
      true,
    );
    // Return to code tab
    this.toolbar.toggleSettings();
  }

  /**
   There are two types of parse errors in the JS Editor
   1. Parse errors that render the JS Object invalid and all functions unrunnable
   2. Parse errors within functions that throw errors when executing those functions
   */
  public AssertParseError(exists: boolean) {
    const { _jsObjectParseErrorCallout } = this;
    // Assert presence/absence of parse error
    cy.get(_jsObjectParseErrorCallout).should(exists ? "exist" : "not.exist");

    if (exists) {
      cy.get(_jsObjectParseErrorCallout).contains("Function failed to execute");
    }
  }

  public SelectFunctionDropdown(funName: string) {
    cy.get(this.runFunctionSelectLocator).click();
    this.agHelper.GetNClickByContains(this._funcDropdownOptions, funName);
  }

  public AssertSelectedFunction(funName: string) {
    cy.get(this.runFunctionSelectLocator).contains(funName).should("exist");
  }

  public ConfirmationClick(type: "Yes" | "No") {
    this.agHelper
      .GetElement(this._confirmationModalBtns(type))
      .eq(0)
      .scrollIntoView()
      .then(($element: any) => {
        cy.get($element).trigger("click", {
          force: true,
        });
      });

    if (type == "Yes")
      this.agHelper.AssertElementAbsence(
        this.locator._specificToast("canceled"),
      ); //Asserting NO is not clicked
  }

  public currentJSObjectName(): Cypress.Chainable<string> {
    return cy.get(this._jsObjName).invoke("text");
  }
}
