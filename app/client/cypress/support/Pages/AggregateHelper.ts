import "cypress-wait-until";
import { v4 as uuidv4 } from "uuid";
import { ObjectsRegistry } from "../Objects/Registry";
import type CodeMirror from "codemirror";
import type { EntityItemsType } from "./AssertHelper";
import { EntityItems } from "./AssertHelper";
import EditorNavigator from "./EditorNavigation";
import { EntityType } from "./EditorNavigation";
import ClickOptions = Cypress.ClickOptions;

type ElementType = string | JQuery<HTMLElement>;

interface DeleteParams {
  action: "Copy to page" | "Move to page" | "Delete" | "Prettify code";
  subAction?: string;
  entityType?: EntityItemsType;
  toastToValidate?: string;
}

interface SubActionParams {
  subAction: string;
  index?: number;
  force?: boolean;
  toastToValidate?: string;
}

interface SelectAndValidateParams {
  clickOptions?: Partial<ClickOptions>;
  widgetName: string;
  widgetType?: EntityType;
  hierarchy?: string[];
  propFieldName: string;
  valueToValidate: string;
  toggleEle?: string | null;
}

let LOCAL_STORAGE_MEMORY: any = {};

export interface IEnterValue {
  propFieldName: string;
  directInput: boolean;
  inputFieldName: string;
  apiOrQuery?: "api" | "query";
}

const DEFAULT_ENTERVALUE_OPTIONS = {
  propFieldName: "",
  directInput: false,
  inputFieldName: "",
};

export class AggregateHelper {
  private locator = ObjectsRegistry.CommonLocators;
  private assertHelper = ObjectsRegistry.AssertHelper;

  public get isMac() {
    return Cypress.platform === "darwin";
  }

  private selectLine = `${
    this.isMac ? "{cmd}{shift}{leftArrow}" : "{shift}{home}"
  }`;

  public get removeLine() {
    return "{backspace}";
  }

  public _modifierKey = `${this.isMac ? "meta" : "ctrl"}`;
  private selectAll = `${this.isMac ? "{cmd}{a}" : "{ctrl}{a}"}`;
  private lazyCodeEditorFallback = ".t--lazyCodeEditor-fallback";
  private lazyCodeEditorRendered = ".t--lazyCodeEditor-editor";
  private toolTipSpan = ".rc-tooltip-inner span";
  _walkthroughOverlay = ".t--walkthrough-overlay";
  _walkthroughOverlayClose = ".t--walkthrough-overlay .t--walkthrough-close";
  _walkthroughOverlayTitle = (title: string) =>
    `//div[contains(@class, 't--walkthrough-overlay')]//p[text()='${title}']`;

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

  public SimulateCopyPaste(action: "copy" | "paste" | "cut") {
    const actionToKey = {
      copy: "c",
      paste: "v",
      cut: "x",
    };
    const keyToSimulate = actionToKey[action];

    // Simulate Ctrl keypress (Ctrl down)
    this.GetElement(this.locator._body).type(`{${this._modifierKey}}`, {
      release: false,
    });

    // Simulate 'C' keypress while Ctrl is held (Ctrl + C)
    this.GetElement(this.locator._body).type(keyToSimulate, { release: false });

    // Release the Ctrl key
    this.GetElement(this.locator._body).type(`{${this._modifierKey}}`, {
      release: true,
    });
  }

  /**
   * Extract the pageId out of the URL, supporting both ObjectID and UUIDv4 values. This implementation is for tests
   * only. Do NOT copy this over to production code.
   * @param urlFragment can be either a full absolute URL (like https://dev.appsmith.com/app/name/page1-...) or just a
   *        path fragment (like /app/name/page1-...) or even a custom slug URL (like /app/custom-slug-...).
   */
  public extractPageIdFromUrl(urlFragment: string): null | string {
    return (
      urlFragment.match(
        /\/app(?:\/[^/]+)?\/[^/]+-([0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/,
      )?.[1] ?? null
    );
  }

  public AddDsl(
    dslFile: string,
    elementToCheckPresenceaftDslLoad: string | "" = "", //    reloadWithoutCache = true,
  ) {
    let layoutId;
    let appId: string | null;
    cy.fixture(dslFile).then((val) => {
      cy.url().then((url) => {
        const pageid = this.extractPageIdFromUrl(url);
        expect(pageid).to.not.be.null;
        //Fetch the layout id
        cy.request("GET", "api/v1/pages/" + pageid).then((response: any) => {
          const respBody = JSON.stringify(response.body);
          const parsedData = JSON.parse(respBody).data;
          layoutId = parsedData.layouts[0].id;
          appId = parsedData.applicationId;
          // Dumping the DSL to the created page
          cy.request({
            method: "PUT",
            url:
              "api/v1/layouts/" +
              layoutId +
              "/pages/" +
              pageid +
              "?applicationId=" +
              appId,
            body: val,
            headers: {
              "X-Requested-By": "Appsmith",
            },
          }).then((dslDumpResp) => {
            expect(dslDumpResp.status).equal(200);
            //this.Sleep(3000); //for dsl to settle in layouts api & then refresh
            this.RefreshPage();
            if (elementToCheckPresenceaftDslLoad)
              this.WaitUntilEleAppear(elementToCheckPresenceaftDslLoad);
            // this.Sleep(5000); //settling time for dsl
            this.assertHelper.AssertNetworkResponseData("@getConsolidatedData");
            this.AssertElementAbsence(this.locator._loading); //Checks the spinner is gone & dsl loaded!
            this.AssertElementAbsence(this.locator._animationSpnner, 20000); //Checks page is loaded with dsl!
          });
        });
      });
    });
  }

  public StartRoutes() {
    cy.intercept("POST", "/api/v1/actions").as("createNewApi");
    cy.intercept("PUT", "/api/v1/actions/*").as("saveAction");
    //cy.intercept("POST", "/api/v1/users/invite", (req) => { req.headers["origin"] = "Cypress";}).as("mockPostInvite");
  }

  public AssertPopoverTooltip(expectedText: string) {
    this.GetText(this.locator._popoverToolTip, "text").then(($tooltiptxt) =>
      expect($tooltiptxt).to.eq(expectedText),
    );
  }

  /**
   *
   * @param selector
   * @param index
   * Checks if the given selector has class with disabled in the class name
   * @returns
   */
  public AssertElementClassContainsDisabled(selector: string, index = 0) {
    return this.GetElement(selector)
      .eq(index)
      .should(($element) => {
        const elementClass = $element.attr("class");
        expect(elementClass).to.include("disabled");
      });
  }

  private rename(args: {
    nameLocator: string;
    textInputLocator: string;
    renameVal: string;
    dblClick?: boolean;
    willFailError?: string;
  }) {
    const { dblClick = false, nameLocator, renameVal, textInputLocator } = args;

    this.Sleep(300);

    if (dblClick) {
      cy.get(nameLocator).dblclick({ force: true });
    } else {
      this.GetNClick(nameLocator, 0, true);
    }

    cy.get(textInputLocator)
      .clear({ force: true })
      .type(renameVal, { force: true, delay: 0 })
      .should("have.value", renameVal);

    if (args.willFailError) {
      this.AssertContains(args.willFailError, "exist", ".ads-v2-tooltip");
      cy.get(textInputLocator).blur();
    } else {
      cy.get(textInputLocator).blur();
      this.PressEnter();
    }
    this.Sleep();
  }

  public RenameDatasource(renameVal: string) {
    this.rename({
      nameLocator: this.locator._dsName,
      textInputLocator: this.locator._dsNameTxt,
      renameVal,
    });
    this.AssertElementVisibility(this.locator._editIcon);
  }

  public RenameQuery(renameVal: string, willFailError?: string) {
    this.rename({
      nameLocator: this.locator._queryName,
      textInputLocator: this.locator._queryNameTxt,
      renameVal,
      dblClick: true,
      willFailError,
    });
  }

  public CheckForPageSaveError() {
    // Wait for "saving" status to disappear
    this.AssertElementAbsence(
      this.locator._statusSaving,
      Cypress.config("defaultCommandTimeout"),
    );
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
      this.AssertElementAbsence(
        this.locator._saveStatusContainer,
        Cypress.config("defaultCommandTimeout"),
      ); //adding timeout since waiting more time is not worth it!

    //this.AssertNetworkStatus("@sucessSave", 200);
  }

  public PopupClose(popUpName: string) {
    this.GetNClick(this.locator._popUpCloseBtn(popUpName));
  }

  public ValidateCodeEditorContent(selector: string, contentToValidate: any) {
    // cy.get(selector).each(($ele) => {
    //   cy.wrap($ele).within(() => {
    //     cy.get(this.locator._codeMirrorCode).should(
    //       "include.text",
    //       contentToValidate,
    //     );
    //   });
    // });

    let isTextContained = false;

    cy.get(selector)
      .each(($ele) => {
        cy.wrap($ele).within(() => {
          cy.get(this.locator._codeMirrorCode)
            .invoke("text")
            .then((text) => {
              if (contentToValidate.includes(text)) {
                isTextContained = true;
              }
            });
        });
      })
      .then(() => {
        expect(isTextContained).to.be.true;
      });
  }

  public GetElement(
    selector: ElementType,
    exists: "exist" | "not.exist" | "noVerify" = "exist",
    timeout = Cypress.config("pageLoadTimeout"),
  ) {
    let locator;
    expect(selector).to.not.be.undefined;
    if (typeof selector == "string") {
      locator =
        selector.startsWith("//") || selector.startsWith("(//")
          ? cy.xpath(selector, {
              timeout,
            })
          : cy.get(selector, {
              timeout,
            });
    } else locator = cy.wrap(selector);
    return exists === "noVerify"
      ? locator // Return the locator without verification if exists is "noVerify"
      : exists === "exist"
        ? locator.should("have.length.at.least", 1)
        : locator.should("have.length", 0);
  }

  public GetNAssertElementText(
    selector: string,
    text: string,
    textPresence:
      | "have.text"
      | "not.have.text"
      | "contain.text"
      | "not.contain.text" = "have.text",
    index = 0,
  ) {
    if (index >= 0)
      this.ScrollIntoView(selector, index).should(textPresence, text);
    else this.GetElement(selector).should(textPresence, text);
  }

  public GetElementsNAssertTextPresence(selector: string, text: string) {
    this.GetElement(selector).then(($elements: any) => {
      let found = false;
      $elements.each((index: any, element: any) => {
        const eleText = Cypress.$(element).text().trim();
        if (eleText === text) {
          found = true;
          return false; // Exit the loop if the expected text is found
        }
      });
      expect(found).to.be.true;
    });
  }

  public ValidateToastMessage(text: string, index = 0, length = 1) {
    if (index != 0) {
      this.GetElement(this.locator._toastMsg, "noVerify")
        .should("have.length.at.least", length)
        .eq(index)
        .should("contain.text", text);
    } else this.GetNAssertContains(this.locator._toastMsg, text);
  }

  public AssertTooltip(toolTipText: string) {
    this.GetNAssertContains(this.toolTipSpan, toolTipText);
  }

  public RemoveUIElement(
    elementToRemove: "EvaluatedPopUp" | "Tooltip" | "Toast",
    toolTipOrToasttext = "",
  ) {
    cy.get("body").then(($body) => {
      switch (elementToRemove) {
        case "EvaluatedPopUp":
          if ($body.find(this.locator._evalPopup).length > 0) {
            this.GetElement(this.locator._evalPopup).then(($evalPopUp) => {
              $evalPopUp.remove();
            });
          }
          break;
        case "Tooltip":
          if (
            $body.find(this.locator._appLeveltooltip(toolTipOrToasttext))
              .length > 0
          ) {
            this.GetElement(this.locator._appLeveltooltip(toolTipOrToasttext))
              .parents("div.rc-tooltip")
              .then(($tooltipElement) => {
                $tooltipElement.remove();
              });
          }
          break;
        case "Toast":
          if (
            $body.find(
              this.locator._toastContainer +
                " span:contains(" +
                toolTipOrToasttext +
                ")",
            ).length > 0
          ) {
            this.GetElement(
              this.locator._toastContainer +
                ":has(:contains('" +
                toolTipOrToasttext +
                "'))",
            ).then(($toastContainer) => {
              $toastContainer.remove();
            });
          }
          break;
      }
    });
  }

  public ClickButton(
    btnVisibleText: string,
    indexOrOptions:
      | number
      | Partial<{
          index: number;
          force: boolean;
          waitAfterClick: boolean;
          sleepTime: number;
          type?: "click" | "invoke";
        }> = 0,
  ) {
    const button = this.locator._buttonByText(btnVisibleText);
    let index: number,
      force = true,
      waitAfterClick = true,
      waitTime = 1000,
      type = "click";

    if (typeof indexOrOptions === "number") {
      index = indexOrOptions;
    } else {
      index = indexOrOptions.index || 0;
      force =
        typeof indexOrOptions.force !== "undefined"
          ? indexOrOptions.force
          : true;
      // waitAfterClick = indexOrOptions.waitAfterClick || false;
      // Check if waitAfterClick is explicitly set, otherwise default to true
      waitAfterClick =
        typeof indexOrOptions.waitAfterClick !== "undefined"
          ? indexOrOptions.waitAfterClick
          : true;
      waitTime = indexOrOptions.sleepTime || 1000;
      type = indexOrOptions?.type || "click";
    }

    const element = this.ScrollIntoView(button, index);
    if (type == "invoke") {
      return element.invoke("click").then(() => {
        if (waitAfterClick) {
          return this.Sleep(waitTime);
        }
      });
    }

    return element.click({ force }).then(() => {
      if (waitAfterClick) {
        return this.Sleep(waitTime);
      }
    });
  }

  public clickMultipleButtons(btnVisibleText: string, waitAfterClick = true) {
    cy.xpath(this.locator._buttonByText(btnVisibleText)).each(($el) => {
      $el.trigger("click", { force: true });
      cy.wait(200);
    });
    waitAfterClick && this.Sleep();
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
        //.contains(msgToCheckforDisappearance)
        .should("have.length", 0);
      this.Sleep();
    });
  }

  public WaitUntilEleDisappear(selector: string) {
    cy.waitUntil(() => this.GetElement(selector, "not.exist"), {
      errorMsg:
        "Element did not disappear after " +
        Cypress.config().pageLoadTimeout +
        "seconds",
      timeout: Cypress.config().pageLoadTimeout,
      interval: 1000,
    });
  }

  public WaitUntilAllToastsDisappear() {
    cy.get("body").then(($body) => {
      if ($body.find(this.locator._toastContainer).length > 0) {
        this.GetElement(this.locator._toastContainer).waitUntil(
          ($ele) => cy.wrap($ele).should("have.length", 0),
          {
            errorMsg:
              "Toasts did not disappear even after " +
              Cypress.config().defaultCommandTimeout +
              " seconds",
            timeout: Cypress.config().defaultCommandTimeout,
            interval: 1000,
          },
        );
      }
    });
  }

  public WaitUntilEleAppear(selector: string) {
    cy.waitUntil(
      () =>
        this.GetElement(selector)
          .should("exist")
          .should("be.visible")
          .its("length")
          .should("be.gte", 1),
      {
        errorMsg:
          "Element did not appear even after " +
          Cypress.config().pageLoadTimeout +
          " seconds",
        timeout: Cypress.config().pageLoadTimeout,
        interval: 2000,
      },
    );

    //Below can be tried if above starts being flaky:
    // cy.waitUntil(() => cy.get(selector, { timeout: 50000 }).should("have.length.greaterThan", 0)
    //or
    // cy.waitUntil(()) => (selector.includes("//") ? cy.xpath(selector) : cy.get(selector))).then(($ele) => { cy.wrap($ele).eq(0).should("be.visible");});
  }

  public WaitForCondition(conditionFn: any) {
    cy.waitUntil(() => conditionFn, {
      timeout: Cypress.config("pageLoadTimeout"),
      interval: 1000,
    });
  }

  public AssertNetworkDataSuccess(aliasName: string, expectedRes = true) {
    cy.wait(1000).wait(aliasName); //Wait a bit for call to finish!
    cy.get(aliasName)
      .its("response.body.data.success")
      .should("eq", expectedRes);
  }

  public AssertNetworkDataNestedProperty(
    aliasName: string,
    expectedPath: string,
    expectedRes: any,
  ) {
    cy.wait(1000).wait(aliasName); //Wait a bit for call to finish!
    cy.get(aliasName).should("have.nested.property", expectedPath, expectedRes);
  }

  public SelectDropDown(dropdownOption: string, endpoint = "selectwidget") {
    const mode = window.localStorage.getItem("inDeployedMode");
    if (mode == "false") {
      this.GetNClick(this.locator._selectWidgetDropdown(endpoint));
    } else {
      this.GetNClick(this.locator._selectWidgetDropdownInDeployed(endpoint));
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
    const modeSelector =
      mode == "true"
        ? this.locator._selectWidgetDropdownInDeployed(endpoint)
        : this.locator._selectWidgetDropdown(endpoint);
    const finalSelector = insideParent
      ? this.locator._divWithClass(insideParent) + modeSelector
      : modeSelector;

    this.GetNClick(finalSelector, index);
    cy.get(this.locator._dropDownValue(dropdownOption)).click({ force: true });
    this.Sleep(); //for selected value to reflect!
  }

  // public SelectDropdownList(ddName: string, dropdownOption: string) {
  //   this.GetNClick(this.locator._existingFieldTextByName(ddName));
  //   cy.get(this.locator._dropdownText).contains(dropdownOption).click();
  // }

  public SelectFromMultiSelect(
    options: string[],
    index = 0,
    check = true,
    endpoint = "multiselectwidgetv2",
  ) {
    this.ScrollIntoView(
      this.locator._widgetInDeployed(endpoint) + " div.rc-select-selector",
      index,
    )
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
      })
      .wait(500); //for dropdown options to settle

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

  public PressEscape(sleep = 500) {
    cy.get("body").type("{esc}");
    this.Sleep(sleep);
  }

  public PressEnter(sleep = 500) {
    cy.get("body").type("{enter}");
    this.Sleep(sleep);
  }

  public PressDelete(sleep = 500) {
    cy.get("body").type(`{del}`, { force: true });
    this.Sleep(sleep);
  }

  public SelectAllWidgets() {
    cy.get("body").type(this.isMac ? "{meta}A" : "{ctrl}A");
  }

  public SetCanvasViewportWidth(width: number) {
    cy.get(this.locator._canvasViewport).invoke("width", `${width}px`);
  }

  public ClickOutside(x = 0, y = 0, force = true) {
    cy.get("body").click(x, y, { force: force });
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
    parseSpecialCharacters = false,
  ) {
    this.ScrollIntoView(this.locator._actionTextArea(actionName), index)
      .parents(".CodeMirror")
      .first()
      .then((ins: any) => {
        const input = ins[0].CodeMirror;
        input.focus();
        this.Sleep(200);
        input.setValue("");
        this.Sleep(200);
      });

    //Not working consistenly, hence commenting
    // .focus()
    // .type("{uparrow}", { force: true })
    // .type("{ctrl}{shift}{downarrow}{del}", { force: true });
    cy.focused().then(($cm: any) => {
      if ($cm.contents != "") {
        this.ScrollIntoView(this.locator._actionTextArea(actionName), index)
          .click({ force: true })
          .focused()
          .clear({
            force: true,
          });
      }
      this.Sleep();

      this.ScrollIntoView(this.locator._actionTextArea(actionName), index).then(
        (el: any) => {
          if (paste) {
            //input.invoke("val", value);
            this.Paste(el, value);
          } else {
            cy.get(el).type(value, {
              parseSpecialCharSequences: parseSpecialCharacters,
            });
          }
        },
      );
      this.AssertAutoSave();
    });
  }

  public VerifyCallCount(alias: string, expectedNumberOfCalls: number) {
    cy.wait(alias);
    cy.get(`${alias}.all`).should("have.length", expectedNumberOfCalls);
  }

  public GetNClickIfPresent(selector: string) {
    cy.get("body").then(($body) => {
      if ($body.find(selector).length > 0) {
        cy.get(selector).click();
      }
    });
  }

  public GetNClick(
    selector: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
    ctrlKey = false,
    metaKey = false,
    position: Cypress.PositionType = "center",
  ) {
    return this.ScrollIntoView(selector, index)
      .click(position, {
        force: force,
        ctrlKey: ctrlKey,
        metaKey,
      })
      .then(($element) => {
        return cy.wrap($element).wait(waitTimeInterval);
      });
  }

  public GetClosestNClick(
    selector: string,
    closestSelector: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
    ctrlKey = false,
  ) {
    return this.ScrollIntoView(selector, index)
      .closest(closestSelector)
      .click({ force: force, ctrlKey: ctrlKey })
      .wait(waitTimeInterval);
  }

  public GetHoverNClick(
    selector: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
  ) {
    return (this.ScrollIntoView(selector, index) as any)
      .realHover()
      .click({ force: force })
      .wait(waitTimeInterval);
  }

  public HoverElement(
    selector: string,
    index = 0,
    realTouch = true,
    waitTimeInterval = 100,
  ) {
    let chain = this.ScrollIntoView(selector, index);
    if (realTouch) {
      chain = (chain as any)
        .realTouch({ position: "center" })
        .realHover({ pointer: "mouse" });
    }
    return (
      chain
        //.trigger("mousemove", { eventConstructor: "MouseEvent" })
        .wait(waitTimeInterval)
    );
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
      .then(($element) => {
        if (
          Cypress.$("body").find($element).length &&
          $element[0].offsetParent !== null
        ) {
          return $element;
        } else {
          $element[0].scrollIntoView();
          return $element;
        }
      })
      .click({ force: force })
      .wait(waitTimeInterval);
  }

  public GoBack() {
    this.GetNClick(this.locator._goBack);
  }

  public SelectAllAndType(selector: string, text: string) {
    this.GetElement(selector).type("{selectall}" + text);
  }

  public SelectNRemoveLineText(selector: string) {
    this.GetElement(selector).type(this.selectLine);
    return this.GetElement(selector).type(this.removeLine);
  }

  public SelectAllRemoveCodeText(selector: string) {
    return this.GetElement(selector).type(this.selectAll + "{del}");
  }

  public RemoveCharsNType(
    selector: string,
    charCount = 0,
    totype: string,
    index = 0,
  ) {
    if (charCount > 0)
      this.GetElement(selector)
        .eq(index)
        .focus()
        .type("{backspace}".repeat(charCount), { timeout: 2, force: true })
        .wait(50)
        .type(totype);
    else {
      if (charCount == -1) this.GetElement(selector).eq(index).clear();
      this.TypeText(selector, totype, index);
    }
  }

  public ClickNClear(selector: string, force = false, index = 0) {
    this.GetNClick(selector, index, force);
    this.ClearTextField(selector, force, index);
  }

  public ClearTextField(selector: string, force = false, index = 0) {
    this.GetElement(selector)
      .eq(index)
      .scrollIntoView({ easing: "linear" })
      .click()
      .clear({ force });
    this.Sleep(500); //for text to clear for CI runs
  }

  public ClearNType(
    selector: string,
    totype: string,
    index = 0,
    force = false,
  ) {
    this.ClearTextField(selector, force, index);
    return this.TypeText(selector, totype, index);
  }

  public TypeText(
    selector: string,
    value: string,
    indexOrOptions:
      | number
      | Partial<{
          index: number;
          parseSpecialCharSeq: boolean;
          shouldFocus: boolean;
          delay: number;
        }> = 0,
  ) {
    let index: number;
    let shouldFocus = true;
    let parseSpecialCharSeq = false;
    let delay = 10;

    if (typeof indexOrOptions === "number") {
      index = indexOrOptions;
    } else {
      index = indexOrOptions.index || 0;
      parseSpecialCharSeq = indexOrOptions.parseSpecialCharSeq || false;
      delay = indexOrOptions.delay || 10;
      shouldFocus =
        indexOrOptions.shouldFocus !== undefined
          ? indexOrOptions.shouldFocus
          : true;
    }

    const element = this.GetElement(selector).eq(index);

    if (shouldFocus) {
      element.focus();
    }

    if (value === "") return element;

    return element.wait(100).type(value, {
      parseSpecialCharSequences: parseSpecialCharSeq,
      delay: delay,
      force: true,
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
    containsText: string | RegExp,
    index = 0,
    force = true,
    waitTimeInterval = 500,
  ) {
    return cy
      .get(selector)
      .contains(containsText, { matchCase: false })
      .eq(index)
      .click({ force: force })
      .wait(waitTimeInterval);
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
    toggle: "true" | "false",
  ) {
    this.GetElement(this.locator._propertyToggleValue(propertyName))
      .invoke("attr", "data-checked")
      .then((classes) => {
        expect(classes).includes(toggle);
      });
  }

  public AssertExistingCheckedState(selector: string, toggle = "true") {
    this.GetElement(selector)
      .invoke("attr", "data-selected-value")
      .then((dataSelectedValue) => {
        if (dataSelectedValue !== undefined) {
          this.GetElement(selector).should(
            "have.attr",
            "data-selected-value",
            toggle,
          );
        } else
          this.GetElement(selector).should(
            toggle == "true" ? "be.checked" : "not.be.checked",
          );
      });
  }

  public AssertSelectedTab(propertyName: string, value: "true" | "false") {
    let locator;
    if (propertyName.startsWith("//")) {
      locator = cy.xpath(propertyName);
      locator.should("have.attr", "aria-checked", value);
    } else if (propertyName.includes(" ")) {
      locator = cy.get(propertyName);
      locator.should("have.attr", "aria-checked", value);
    }
  }

  public AssertAttribute(
    selector: string,
    attribName: string,
    attribValue: any,
    index = 0,
  ) {
    return this.GetElement(selector)
      .eq(index)
      .should("have.attr", attribName, attribValue);
  }

  public AssertProperty(
    selector: string,
    propName: string,
    propValue: any,
    index = 0,
  ) {
    return this.GetElement(selector)
      .eq(index)
      .should("have.prop", propName, propValue);
  }

  public AssertCSS(
    selector: string,
    cssName: string,
    cssValue: string,
    index = 0,
  ) {
    return this.GetElement(selector)
      .eq(index)
      .should("have.css", cssName, cssValue);
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

  public GenerateUUID() {
    let id = uuidv4();
    id = "Cy" + id.split("-")[0];
    cy.wrap(id).as("guid");
  }

  public GetObjectName() {
    //cy.get(this.locator._queryName).invoke("text").then((text) => cy.wrap(text).as("queryName")); or below syntax
    return cy.get(this.locator._queryName).invoke("text");
  }

  public GetElementLength(selector: string) {
    return this.GetElement(selector).its("length");
  }

  public Sleep(timeout = 1000) {
    return cy.wait(timeout);
  }

  public RefreshPage(
    networkCallAlias = "getWorkspace", //    reloadWithoutCache = true,
  ) {
    this.Sleep(2000);
    this.assertHelper.AssertDocumentReady();
    // // cy.window()
    // //   .then((win) => {
    // //     win.location.reload();
    // //   })
    // cy.reload(reloadWithoutCache).then(() => {
    //   this.assertHelper.AssertDocumentReady();
    // });

    cy.url().then((url) => {
      cy.window({ timeout: 60000 }).then((win) => {
        win.location.href = url;
      });
    });
    this.AssertElementAbsence(
      this.locator._specificToast("Cannot read properties of undefined"),
    );
    this.assertHelper.AssertDocumentReady();
    this.Sleep(4000); //for page to load for CI runs
    networkCallAlias &&
      this.assertHelper.AssertNetworkStatus("@" + networkCallAlias); //getWorkspace for Edit page!
  }

  public CypressReload() {
    cy.reload();
    this.assertHelper.AssertDocumentReady();
  }

  public ActionContextMenuWithInPane({
    action = "Delete",
    entityType = EntityItems.JSObject,
    subAction = "",
    toastToValidate = "",
  }: DeleteParams) {
    cy.get(this.locator._contextMenuInPane).click();
    this.GetNClick(this.locator._contextMenuItem(action));
    if (action == "Delete") {
      this.DeleteEntityNAssert(entityType);
    } else if (subAction) {
      this.ActionContextMenuSubItem({
        subAction: subAction,
        toastToValidate: toastToValidate,
      });
      toastToValidate && this.AssertContains(toastToValidate);
    }
  }

  public DeleteEntityNAssert(
    entityType: EntityItemsType,
    toAssertAction = true,
  ) {
    if (entityType != EntityItems.Widget)
      this.GetNClick(this.locator._contextMenuItem("Are you sure?"));
    this.Sleep();
    toAssertAction && this.assertHelper.AssertDelete(entityType);
  }

  public ActionContextMenuSubItem({
    force = false,
    subAction,
    toastToValidate = "",
  }: SubActionParams) {
    cy.xpath(this.locator._contextMenuItem(subAction)).trigger("click", {
      force: force,
    });
    this.Sleep(500);
    toastToValidate && this.AssertContains(toastToValidate);
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
    toVerifySave = true,
  ) {
    const { apiOrQuery, directInput, inputFieldName, propFieldName } = options;
    if (propFieldName && directInput && !inputFieldName) {
      this.UpdateCodeInput(propFieldName, valueToEnter, apiOrQuery);
    } else if (inputFieldName && !propFieldName && !directInput) {
      this.UpdateCodeInput(
        this.locator._inputFieldByName(inputFieldName),
        valueToEnter,
      );
    }
    toVerifySave && this.AssertAutoSave();
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
    cy.xpath(this.locator._inputWidgetValueField(name, isInput)).clear({
      force: true,
    });
  }

  public UpdateCodeInput(
    selector: string,
    value: string,
    apiOrQuery: "api" | "query" = "query",
  ) {
    this.EnableAllCodeEditors();

    const isXPathSelector =
      selector.startsWith("//") || selector.startsWith("(//");
    // A previous version of this code used a more simple `this.GetElement(xPathOrCssSelector).find(".CodeMirror")` command.
    // However, occasionally, this would lead to a race condition: React would re-render between calls to `this.GetElement()`
    // and `.find(".CodeMirror")`, causing the element from the first call to be detached from the DOM.
    // Relevant docs: http://web.archive.org/web/20210618235924/https://docs.cypress.io/guides/core-concepts/retry-ability#Only-the-last-command-is-retried
    //
    // This was fixed in Cypress 12 (https://github.com/cypress-io/cypress/issues/7306), which started to retry
    // the entire query chain (https://docs.cypress.io/guides/core-concepts/retry-ability#Only-queries-are-retried),
    // but until we’ve upgraded to v12, we can’t rely on that and have to fit everything into a single query.
    const codeMirrorSelector = isXPathSelector
      ? selector +
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' CodeMirror ')]"
      : selector + " .CodeMirror";
    this.GetElement(codeMirrorSelector)
      .find("textarea")
      .parents(".CodeMirror")
      .first()
      .then((ins) => {
        const input = (ins[0] as any).CodeMirror as CodeMirror.Editor;
        if (apiOrQuery === "api") {
          setTimeout(() => {
            input.focus();
            setTimeout(() => {
              input.setValue(value);
              setTimeout(() => {
                input.execCommand("goLineStart");
                // Move cursor to the end of the line
                input.execCommand("goLineEnd");
              }, 1000);
            }, 500);
          }, 500);
        } else {
          input.focus();
          this.Sleep(200);
          input.setValue(value);
          this.Sleep(200);
          input.execCommand("goLineEnd");
          this.Sleep(200);
        }
      });
    this.Sleep(); //for value set to register
  }

  public UpdateFieldInput(selector: string, value: string) {
    this.GetElement(selector)
      .find("input")
      .invoke("attr", "value", value)
      .trigger("input");
    this.Sleep(); //for value set to register
  }

  public ValidateFieldInputValue(selector: string, value: string) {
    this.GetElement(selector)
      .closest("input")
      .scrollIntoView({ easing: "linear" })
      .invoke("val")
      .then((inputValue) => {
        expect(inputValue).to.equal(value);
      });
    this.Sleep(); //for value set to register
  }

  public UpdateTextArea(selector: string, value: string) {
    this.GetElement(selector)
      .find("textarea")
      .first()
      .invoke("val", value)
      .trigger("input");
    this.Sleep(500); //for value set to register
  }

  public TypeIntoTextArea(selector: string, value: string) {
    this.GetElement(selector)
      .find("textarea")
      .first()
      .type(value, { delay: 0, force: true, parseSpecialCharSequences: false });
    this.Sleep(500); //for value set to register
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
    (
      cy
        .get(this.locator._evaluatedCurrentValue)
        .first()
        .should("be.visible") as any
    ).realHover({ pointer: "mouse" });
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
    this.GetElement(this.locator._evaluatedCurrentValue)
      .first()
      .should("be.visible")
      .should("not.have.text", "undefined");
    this.GetElement(this.locator._evaluatedCurrentValue)
      .first()
      .click({ force: true })
      .then(($text) => {
        if ($text.text()) expect($text.text()).to.eq(currentValue);
      })
      .trigger("mouseout");
  }

  public UploadFile(fixtureName: string, toClickUpload = true, index = 0) {
    //cy.fixture(fixtureName).as("selectFileFixture");//giving issue, hence using directly as below
    cy.get(this.locator._uploadFiles)
      .eq(index)
      .selectFile("cypress/fixtures/" + fixtureName, { force: true })
      .wait(3000);
    toClickUpload && this.GetNClick(this.locator._uploadBtn, 0, false);
  }

  public AssertElementAbsence(selector: ElementType, timeout = 0) {
    //Should not exists - cannot take indexes
    return this.GetElement(selector, "not.exist", timeout).should("not.exist");
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
      .should("be.closeTo", height, 1);
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

  public AssertElementVisibility(
    selector: ElementType,
    visibility = true,
    index = 0,
    timeout = Cypress.config("pageLoadTimeout"),
  ) {
    return this.GetElement(selector, "exist", timeout)
      .eq(index)
      .scrollIntoView()
      .should(visibility == true ? "be.visible" : "not.be.visible");
    //return this.ScrollIntoView(selector, index, timeout).should("be.visible");//to find out why this is failing.
  }

  IsElementVisible(selector: ElementType) {
    return this.GetElement(selector).then(($element) =>
      Cypress.$($element).length > 0 ? true : false,
    ) as Cypress.Chainable<boolean>;
  }

  /**
   * Checks if the specified instance of the element is present with number and visible on the page.
   *
   * @param {ElementType} selector - The element selector.
   * @param {number} [eq=0] - The index of the element to check (default is 0).
   * @returns {Cypress.Chainable<boolean>} - Returns a boolean wrapped in a Cypress Chainable indicating visibility.
   */
  IsElementVisibleWithEq(selector: ElementType, eq: number = 0) {
    return this.GetElement(selector)
      .eq(eq)
      .then(($element) => {
        // Check if the element is present and visible
        const isVisible =
          Cypress.$($element).length > 0 && Cypress.$($element).is(":visible");
        console.log(`Element visibility: ${isVisible}`);
        return isVisible;
      }) as Cypress.Chainable<boolean>;
  }

  public FailIfErrorToast(error: string) {
    cy.get("body").then(($ele) => {
      if ($ele.find(this.locator._toastMsg).length > 0) {
        if ($ele.find(this.locator._specificToast(error)).length > 0) {
          throw new Error("Error Toast from Application:" + error);
        }
      }
    });
  }

  public AssertElementExist(
    selector: ElementType,
    index = 0,
    timeout = Cypress.config("defaultCommandTimeout"),
  ) {
    return this.GetElement(selector, "exist", timeout)
      .eq(index)
      .should("exist");
  }

  public ScrollIntoView(
    selector: ElementType,
    index = 0,
    timeout = Cypress.config("defaultCommandTimeout"),
  ) {
    return this.GetElement(selector, "exist", timeout)
      .should("have.length.at.least", 1)
      .eq(index)
      .then(($element) => {
        if (
          Cypress.$("body").find($element).length &&
          $element[0].offsetParent !== null
        ) {
          return $element;
        } else {
          $element[0].scrollIntoView();
          return $element;
        }
      });
  }

  public AssertElementLength(
    selector: ElementType,
    length: number,
    index: number | null = null,
  ) {
    if (index)
      return this.GetElement(selector, "noVerify")
        .eq(index)
        .should("have.length", length);
    else
      return this.GetElement(selector, "noVerify").should(
        "have.length",
        length,
      );
  }

  public FocusElement(selector: ElementType) {
    this.GetElement(selector).focus();
  }

  public AssertContains(
    text: string | RegExp,
    exists: "exist" | "not.exist" | "be.visible" = "exist",
    selector?: string,
  ) {
    let timeout = Cypress.config().pageLoadTimeout;
    if (selector) {
      return cy.contains(selector, text, { timeout }).should(exists);
    }
    return cy.contains(text, { timeout }).should(exists);
  }

  public GetNAssertContains(
    selector: ElementType,
    text: string | number | RegExp,
    exists: "exist" | "not.exist" = "exist",
  ) {
    return this.GetElement(selector, "noVerify").contains(text).should(exists);
  }

  public AssertURL(url: string) {
    this.WaitForCondition(() =>
      cy.url().then((currentUrl) => {
        return currentUrl.includes(url);
      }),
    );
    this.assertHelper.AssertDocumentReady();
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

  public ScrollToXY(
    selector: ElementType,
    x: number | string,
    y: number | string,
  ) {
    return this.GetElement(selector).scrollTo(x, y).wait(2000);
  }

  public GetWidth(widgetSelector: string) {
    this.GetElement(widgetSelector).then(($element) => {
      cy.wrap(Number($element.width())).as("eleWidth");
    });
  }

  public GetHeight(widgetSelector: string) {
    this.GetElement(widgetSelector).then(($element) => {
      cy.wrap(Number($element.height())).as("eleHeight");
    });
  }

  public GetWidgetCSSHeight(widgetSelector: string, index = 0) {
    return this.GetElement(widgetSelector).eq(index).invoke("css", "height");
  }

  public GetWidgetCSSFrAttribute(
    widgetSelector: string,
    attribute: string,
    index = 0,
  ) {
    return this.GetElement(widgetSelector).eq(index).invoke("css", attribute);
  }

  public GetWidgetCSSValue(
    widgetSelector: string,
    attribute: string,
    index = 0,
  ) {
    return this.GetElement(widgetSelector)
      .eq(index)
      .then(($element) => {
        cy.wrap($element.css(attribute)).as("cssAttributeValue");
      });
  }

  GetWidgetByName(widgetName: string) {
    return this.GetElement(this.locator._widgetByName(widgetName));
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
    return this.GetElement(selector)
      .eq(index)
      .should(disabled ? "have.attr" : "not.have.attr", "disabled");
  }

  // Waits until all LazyCodeEditor wrappers finished loading the actual code editor.
  // Called “EnableAllCodeEditors” to match the command in the JS part of the Cypress codebase
  // with the same name.
  public EnableAllCodeEditors() {
    cy.get(this.lazyCodeEditorFallback, { timeout: 60000 }).should("not.exist");
    // Code editors might not always be present on the page, so we need to check for their existence first
    // (https://docs.cypress.io/guides/core-concepts/conditional-testing#Element-existence)
    cy.get("body").then(($body) => {
      if ($body.find(this.lazyCodeEditorRendered).length === 0) return;

      return cy.get(this.lazyCodeEditorRendered).each(($el) => {
        cy.wrap($el).find(".CodeMirror").should("exist");
      });
    });
  }

  public AssertNewTabOpened(openTabFunc: () => void) {
    cy.window().then((win) => {
      cy.spy(win, "open").as("windowOpen");
      openTabFunc();
      cy.get("@windowOpen").should("be.called");
    });
  }

  public VisitNAssert(url: string, apiToValidate = "") {
    cy.visit(url);
    this.AssertURL(url);
    if (Cypress.env("AIRGAPPED")) {
      // Intentionally left blank: No actions needed in air-gapped environment
    } else
      apiToValidate && this.assertHelper.AssertNetworkStatus(apiToValidate);
  }

  public GetDropTargetId(widgetName: string) {
    return this.GetWidgetByName(widgetName).invoke("attr", "id");
  }

  public GetModalDropTargetId() {
    return this.GetElement(this.locator._modal).invoke("attr", "id");
  }

  public BrowserNavigation(direction: number) {
    //passing 1 works as browser back
    //passing -1 works as browser forward
    cy.go(direction);
  }

  public AssertCursorInput($selector: string, cursor = { ch: 0, line: 0 }) {
    this.EnableAllCodeEditors();
    cy.get($selector)
      .first()
      .find(".CodeMirror")
      .first()
      .then((ins) => {
        const input = (ins[0] as any).CodeMirror;
        // The input gets focused with a slight delay so we need to wait for it
        cy.waitUntil(() => input.hasFocus()).then(() => {
          const editorCursor = input.getCursor();
          expect(editorCursor.ch).to.equal(cursor.ch);
          expect(editorCursor.line).to.equal(cursor.line);
        });
      });
  }

  public GetAttribute(selector: string, attribName: string, index = 0) {
    return this.GetElement(selector).eq(index).invoke("attr", attribName);
  }

  public AssertClassExists(selector: string, className: string) {
    this.GetElement(selector).should("have.class", className);
  }

  public VerifySnapshot(selector: string, identifier: string) {
    this.GetElement(selector).matchImageSnapshot(identifier);
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

  public GetChildrenNClick(
    selector: string,
    childSelector: string,
    index = 0,
    force = false,
    waitTimeInterval = 500,
    ctrlKey = false,
  ) {
    return this.ScrollIntoView(selector, index)
      .children(childSelector)
      .click({ force: force, ctrlKey: ctrlKey })
      .wait(waitTimeInterval);
  }

  public selectAndValidateWidgetNameAndProperty({
    clickOptions = {},
    hierarchy = [],
    propFieldName,
    toggleEle = null,
    valueToValidate,
    widgetName,
    widgetType = EntityType.Widget,
  }: SelectAndValidateParams) {
    // Select the widget by name, type, and hierarchy with optional click options
    EditorNavigator.SelectEntityByName(
      widgetName,
      widgetType,
      clickOptions,
      hierarchy,
    );

    // Assert that the Property Pane title matches the widget name
    this.AssertText(
      ObjectsRegistry.PropertyPane._paneTitle,
      "text",
      widgetName,
    );

    // If a toggle element is provided, toggle its JavaScript mode
    if (toggleEle) {
      ObjectsRegistry.PropertyPane.ToggleJSMode(toggleEle);
    }

    // Validate that the property field value matches the expected value
    ObjectsRegistry.PropertyPane.ValidatePropertyFieldValue(
      propFieldName,
      valueToValidate,
    );
  }

  public RemoveChars(selector: string, charCount = 0, index = 0) {
    if (charCount > 0)
      this.GetElement(selector)
        .eq(index)
        .focus()
        .type("{backspace}".repeat(charCount), { timeout: 2, force: true })
        .wait(50);
    else {
      if (charCount == -1) this.GetElement(selector).eq(index).clear();
    }
  }

  public captureConsoleLogs(): void {
    cy.window()
      .its("console")
      .then((console) => {
        cy.spy(console, "log").as("log");
        cy.spy(console, "error").as("error");
        cy.spy(console, "warn").as("warn");
      });
  }

  public verifyConsoleLogNotContainingError(): void {
    cy.get("@error")
      .invoke("getCalls")
      .then((calls) => {
        console.table(calls);
        cy.wrap(calls).each((call) => {
          (call as any).args.forEach((arg: any) => {
            expect(arg).to.not.contain("error");
          });
        });
      });
  }

  public verifyConsoleLogContainsExpectedMessage(message: string): void {
    cy.get("@log")
      .invoke("getCalls")
      .then((calls) => {
        console.table(calls);
        cy.wrap(calls).each((call) => {
          (call as any).args.forEach((arg: any) => {
            expect(arg).to.contain(message);
          });
        });
      });
  }

  public clearConsoleLogs(): void {
    cy.window().then((win) => {
      cy.spy(win.console, "log").as("log");
      cy.spy(win.console, "error").as("error");
      cy.spy(win.console, "warn").as("warn");
    });
  }

  public waitForEmail({
    pollInterval,
    targetEmail,
    targetSubject,
    timeout,
  }: {
    pollInterval: number;
    timeout: number;
    targetSubject: string;
    targetEmail?: string;
  }): Cypress.Chainable<any> {
    const startTime = Date.now();
    let latestEmailDate: Date | null = null;
    let latestEmail: any = null;

    function parseDate(dateString: string): Date {
      return new Date(dateString.replace(/ \([A-Za-z\s]*\)$/, ""));
    }

    function fetchEmail(): Cypress.Chainable<any> {
      return cy
        .request("http://localhost:5001/api/v1/maildev-emails")
        .then((res) => {
          if (res.status !== 200) {
            throw new Error(`Request failed with status ${res.status}`);
          }

          const emails: Array<{
            headers: { subject: string; date: string; to: string[] };
            text: string;
          }> = res.body;

          console.log(
            "Fetched email subjects:",
            emails.map((email) => email.headers.subject),
          );

          let matchingEmail;

          if (targetEmail) {
            console.log(
              "Filtering emails with targetSubject:",
              targetSubject,
              "and targetEmail:",
              targetEmail,
            );
            matchingEmail = emails.filter((email) => {
              console.log(
                "Comparing subject:",
                email.headers.subject.trim(),
                "to targetSubject:",
                targetSubject.trim(),
              );
              console.log(
                "Substring match:",
                email.headers.subject
                  .trim()
                  .toLowerCase()
                  .includes(targetSubject.trim().toLowerCase()),
              );

              const toAddresses = email.headers.to.split(" "); // Split the email.to into an array of addresses
              console.log("Email 'to' addresses:", toAddresses);

              return (
                email.headers.subject
                  .trim()
                  .toLowerCase()
                  .includes(targetSubject.trim().toLowerCase()) &&
                toAddresses.some(
                  (to) => to.toLowerCase() === targetEmail.toLowerCase(),
                ) // Case-insensitive matching
              );
            });
            console.log("Matching emails with targetEmail:", matchingEmail);
          } else {
            console.log("Filtering emails with targetSubject:", targetSubject);
            matchingEmail = emails.filter((email) => {
              console.log(
                "Comparing subject:",
                email.headers.subject.trim(),
                "to targetSubject:",
                targetSubject.trim(),
              );
              console.log(
                "Substring match:",
                email.headers.subject
                  .trim()
                  .toLowerCase()
                  .includes(targetSubject.trim().toLowerCase()),
              );
              return email.headers.subject
                .trim()
                .toLowerCase()
                .includes(targetSubject.trim().toLowerCase());
            });
            console.log("Matching emails without targetEmail:", matchingEmail);
          }

          if (matchingEmail.length > 0) {
            matchingEmail.forEach((email) => {
              const emailDate = parseDate(email.headers.date);

              if (emailDate <= (latestEmailDate || new Date(0))) {
                console.log(
                  `Subject matched but date not updated: ${email.headers.subject}, Email Date: ${emailDate}, Latest Date: ${latestEmailDate}`,
                );
              }

              if (!latestEmailDate || emailDate > latestEmailDate) {
                latestEmailDate = emailDate;
                latestEmail = email;
              }
            });
          }

          if (latestEmail) {
            console.log(
              `Found email: ${latestEmail.headers.subject}, Date: ${latestEmailDate}`,
            );
            return cy.wrap(latestEmail);
          }

          if (Date.now() - startTime > timeout) {
            console.error("No matching email found within the timeout period.");
            console.log("Fetched email details during the period:", emails);
            return cy.wrap(null);
          }

          return cy.wait(pollInterval).then(fetchEmail);
        });
    }

    return fetchEmail().then((email) => {
      if (!email) {
        throw new Error(
          `Timeout: No email with subject "${targetSubject}" found${
            targetEmail ? ` for recipient "${targetEmail}"` : ""
          }.`,
        );
      }
      return email;
    });
  }
}
