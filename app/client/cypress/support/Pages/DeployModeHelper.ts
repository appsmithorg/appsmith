import { ObjectsRegistry } from "../Objects/Registry";

export class DeployMode {
  private locator = ObjectsRegistry.CommonLocators;
  private agHelper = ObjectsRegistry.AggregateHelper;
  private assertHelper = ObjectsRegistry.AssertHelper;

  _jsonFieldName = (fieldName: string) => `//p[text()='${fieldName}']`;
  _jsonFormFieldByName = (fieldName: string, input = true) =>
    this._jsonFieldName(fieldName) +
    `/ancestor::div[@direction='column']//div[@data-testid='input-container']//${
      input ? "input" : "textarea"
    }`;
  _jsonFormRadioFieldByName = (fieldName: string) =>
    `//p[text()='${fieldName}']/ancestor::div[@direction='column']//div[@data-testid='radiogroup-container']//input`;
  _jsonFormDatepickerFieldByName = (fieldName: string) =>
    `//p[text()='${fieldName}']/ancestor::div[@direction='column']//div[@data-testid='datepicker-container']//input`;
  _jsonFormNumberFieldByName = (
    fieldName: string,
    direction: "up" | "down" = "up",
  ) =>
    `//p[text()='${fieldName}']/ancestor::div[@direction='column']//div[@data-testid='input-container']// ${
      direction == "up" ? this.locator._chevronUp : this.locator._chevronDown
    }`;
  _jsonSelectDropdown = "button.select-button";
  private _jsonFormMultiSelectByName = (fieldName: string) =>
    `//p[text()='${fieldName}']/ancestor::div[@direction='column']//div[@data-testid='multiselect-container']//div[contains(@class, 'rc-select-show-arrow')]`;
  _clearDropdown = "button.select-button span.cancel-icon";
  private _jsonFormMultiSelectOptions = (option: string) =>
    `//div[@title='${option}']//input[@type='checkbox']/ancestor::div[@title='${option}']`;
  private _backtoHome =
    ".t--app-viewer-navigation-header .t--app-viewer-back-to-apps-button";
  private _homeAppsmithImage = "a.t--appsmith-logo";
  public _deployPageWidgets =
    ".bp3-heading, section.canvas [data-testid=t--app-viewer-page]:not(:empty)";
  public _appViewPageName = `div.t--app-viewer-application-name`;
  public homePagaHeader = `[data-testid="t--appsmith-page-header"]`;

  //refering PublishtheApp from command.js
  public DeployApp(
    eleToCheckInDeployPage?: string,
    toCheckFailureToast = true,
    toValidateSavedState = true,
    addDebugFlag = true,
  ) {
    this.agHelper.Sleep();
    toValidateSavedState && this.agHelper.AssertAutoSave();
    this.assertHelper.AssertDocumentReady();
    this.StubbingDeployPage(addDebugFlag);
    this.agHelper.ClickButton("Deploy");
    this.agHelper.AssertElementAbsence(this.locator._btnSpinner, 10000);
    this.assertHelper.AssertDocumentReady();

    this.agHelper.WaitUntilEleAppear(
      eleToCheckInDeployPage ?? this.locator._backToEditor,
    );
    localStorage.setItem("inDeployedMode", "true");
    toCheckFailureToast &&
      this.agHelper.AssertElementAbsence(
        this.locator._specificToast("has failed"),
      ); //Validating bug - 14141 + 14252
    this.agHelper.AssertElementVisibility(this._deployPageWidgets);
    this.agHelper.Sleep(2000); //for view page widgets to load
  }

  // Stubbing window.open to open in the same tab
  public StubbingWindow(timeout = 60000) {
    cy.window({ timeout }).then((window: any) => {
      cy.stub(window, "open")
        .as("windowStub")
        .callsFake((url) => {
          window.location.href = url;
          window.location.target = "_self";
        });
    });
  }

  public StubbingDeployPage(addDebugFlag = true) {
    // cy.window({ timeout: 60000 }).then((window) => {
    //   cy.stub(window, "open")
    //     .as("windowDeployStub")
    //     .callsFake((url) => {
    //       const updatedUrl = `${Cypress.config().baseUrl + url.substring(1)}`;
    //       window.location.href = `${updatedUrl}${
    //         addDebugFlag
    //           ? (updatedUrl.indexOf("?") > -1 ? "&" : "?") + "debug=true"
    //           : ""
    //       }`;
    //     });
    // });

    // //this.StubbingWindow();
    let updatedUrl = "";
    cy.window({ timeout: 60000 }).then((window) => {
      const originalOpen = window.open; // Save a reference to the original window.open function
      window.open = (url: any) => {
        updatedUrl = `${Cypress.config().baseUrl + url.substring(1)}`;
        originalOpen.call(
          window,
          `${updatedUrl}${
            addDebugFlag
              ? (updatedUrl.indexOf("?") > -1 ? "&" : "?") + "debug=true"
              : ""
          }`,
          "_self",
        );
        return null;
      };
    });
  }

  public StubWindowNAssert(
    selector: string,
    expectedUrl: string,
    networkCall: string,
  ) {
    this.StubbingWindow();
    this.agHelper.GetNClick(selector, 0, false, 0);
    this.agHelper.Sleep(4000);
    cy.get("@windowStub").should("be.calledOnce");
    cy.url().should("contain", expectedUrl);
    this.agHelper.Sleep(2000);
    cy.window({ timeout: 60000 }).then((win) => {
      win.history.back();
    });
    this.assertHelper.AssertNetworkResponseData("@" + networkCall);
    this.assertHelper.AssertDocumentReady();
  }

  public NavigateBacktoEditor(toastToCheck = "") {
    this.assertHelper.AssertDocumentReady();
    this.agHelper.GetNClick(this.locator._backToEditor, 0, true);
    this.agHelper.Sleep();
    localStorage.setItem("inDeployedMode", "false");
    if (toastToCheck) {
      this.agHelper.ValidateToastMessage(toastToCheck);
    }
    this.agHelper.AssertElementAbsence(
      this.locator._specificToast("There was an unexpected error"),
    );
    this.agHelper.AssertElementAbsence(
      this.locator._specificToast(
        "Internal server error while processing request",
      ),
    );
    this.agHelper.AssertElementAbsence(
      this.locator._specificToast("Cannot read properties of undefined"),
    );
    this.assertHelper.AssertNetworkResponseData("@getConsolidatedData");

    this.assertHelper.AssertNetworkStatus("@getWorkspace");
    this.assertHelper.AssertDocumentReady();
    this.agHelper.AssertElementVisibility(this.locator._editPage);
  }

  public NavigateToHomeDirectly() {
    this.agHelper.GetNClick(this._backtoHome);
    this.agHelper.WaitUntilEleAppear(this.homePagaHeader);
  }

  public EnterJSONInputValue(
    fieldName: string,
    value: string,
    index = 0,
    clearField = false,
  ) {
    if (clearField) this.ClearJSONFieldValue(fieldName, index);

    cy.xpath(this._jsonFormFieldByName(fieldName))
      .eq(index)
      .click()
      .type(value, { delay: 0 })
      .wait(200);
  }

  public EnterJSONTextAreaValue(fieldName: string, value: string, index = 0) {
    cy.xpath(this._jsonFormFieldByName(fieldName, false))
      .eq(index)
      .click()
      .type(value, { delay: 0 })
      .wait(200);
  }

  public ClearJSONFieldValue(fieldName: string, index = 0, isInput = true) {
    cy.xpath(this._jsonFormFieldByName(fieldName, isInput))
      .eq(index)
      .clear()
      .wait(300);
  }

  public SelectJsonFormDropDown(dropdownOption: string, index = 0) {
    cy.get(this._jsonSelectDropdown).eq(index).scrollIntoView().click();
    cy.get(this.locator._selectOptionValue(dropdownOption)).click({
      force: true,
    });
    this.agHelper.Sleep();
  }

  public SelectJsonFormMultiSelect(
    name: string,
    options: string[],
    index = 0,
    check = true,
  ) {
    cy.xpath(this._jsonFormMultiSelectByName(name))
      .eq(index)
      .scrollIntoView()
      .click();
    this.agHelper.Sleep(500);

    if (check) {
      options.forEach(($each) => {
        cy.get(this.locator._multiSelectOptions($each))
          .check({ force: true })
          .wait(800);
        cy.xpath(this._jsonFormMultiSelectOptions($each)).should(
          "have.class",
          "rc-select-item-option-selected",
        );
      });
    } else {
      options.forEach(($each) => {
        cy.get(this.locator._multiSelectOptions($each))
          .uncheck({ force: true })
          .wait(800);
        cy.xpath(this._jsonFormMultiSelectOptions($each)).should(
          "not.have.class",
          "rc-select-item-option-selected",
        );
      });
    }
    cy.get("body").type("{esc}");
  }
}
