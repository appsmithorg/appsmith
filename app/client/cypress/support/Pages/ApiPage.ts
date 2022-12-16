import { ObjectsRegistry } from "../Objects/Registry";

type RightPaneTabs = "datasources" | "connections";

export class ApiPage {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;

  private _createapi = ".t--createBlankApiCard";
  private _resourceUrl = ".t--dataSourceField";
  private _headerKey = (index: number) =>
    ".t--actionConfiguration\\.headers\\[0\\]\\.key\\." + index + "";
  private _headerValue = (index: number) =>
    ".t--actionConfiguration\\.headers\\[0\\]\\.value\\." + index + "";
  private _paramKey = (index: number) =>
    ".t--actionConfiguration\\.queryParameters\\[0\\]\\.key\\." + index + "";
  private _paramValue = (index: number) =>
    ".t--actionConfiguration\\.queryParameters\\[0\\]\\.value\\." + index + "";
  _bodyKey = (index: number) =>
    ".t--actionConfiguration\\.bodyFormData\\[0\\]\\.key\\." + index + "";
  _bodyValue = (index: number) =>
    ".t--actionConfiguration\\.bodyFormData\\[0\\]\\.value\\." + index + "";
  _bodyTypeDropdown =
    "//span[text()='Type'][@class='bp3-button-text']/parent::button";
  private _apiRunBtn = ".t--apiFormRunBtn";
  private _queryTimeout =
    "//input[@name='actionConfiguration.timeoutInMillisecond']";
  _responseBody = ".CodeMirror-code  span.cm-string.cm-property";
  private _blankAPI = "span:contains('New Blank API')";
  private _apiVerbDropdown = ".t--apiFormHttpMethod";
  private _verbToSelect = (verb: string) =>
    "//div[contains(@class, 't--dropdown-option')]//span[contains(text(),'" +
    verb +
    "')]";
  private _bodySubTab = (subTab: string) => `[data-cy='tab--${subTab}']`;
  private _rightPaneTab = (tab: string) => `[data-cy='t--tab-${tab}']`;
  _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']";
  _visibleTextDiv = (divText: string) => "//div[text()='" + divText + "']";
  _noBodyMessageDiv = "#NoBodyMessageDiv";
  _noBodyMessage = "This request does not have a body";
  _imageSrc = "//img/parent::div";
  private _trashDelete = "span[name='delete']";
  private _onPageLoad = "input[name='executeOnLoad'][type='checkbox']";
  private _confirmBeforeRunningAPI =
    "input[name='confirmBeforeExecute'][type='checkbox']";
  private _paginationTypeLabels = ".t--apiFormPaginationType label";
  _saveAsDS = ".t--store-as-datasource";
  _responseStatus = ".t--response-status-code";
  private _blankGraphqlAPI = "span:contains('New Blank GraphQL API')";
  public _responseTabHeader = "[data-cy=t--tab-headers]";

  CreateApi(
    apiName = "",
    apiVerb: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  ) {
    cy.get(this.locator._createNew).click({ force: true });
    cy.get(this._blankAPI).click({ force: true });
    this.agHelper.ValidateNetworkStatus("@createNewApi", 201);

    // cy.get("@createNewApi").then((response: any) => {
    //     expect(response.response.body.responseMeta.success).to.eq(true);
    //     cy.get(this.agHelper._actionName)
    //         .click()
    //         .invoke("text")
    //         .then((text) => {
    //             const someText = text;
    //             expect(someText).to.equal(response.response.body.data.name);
    //         });
    // }); // to check if Api1 = Api1 when Create Api invoked

    if (apiName) this.agHelper.RenameWithInPane(apiName);
    cy.get(this._resourceUrl).should("be.visible");
    if (apiVerb != "GET") this.SelectAPIVerb(apiVerb);
  }

  CreateAndFillApi(
    url: string,
    apiName = "",
    queryTimeout = 10000,
    apiVerb: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  ) {
    this.CreateApi(apiName, apiVerb);
    this.EnterURL(url);
    this.agHelper.AssertAutoSave();
    //this.agHelper.Sleep(2000);// Added because api name edit takes some time to reflect in api sidebar after the call passes.
    cy.get(this._apiRunBtn).should("not.be.disabled");
    if (queryTimeout != 10000) this.SetAPITimeout(queryTimeout);
  }

  EnterURL(url: string) {
    this.agHelper.EnterValue(url, {
      propFieldName: this._resourceUrl,
      directInput: true,
      inputFieldName: "",
    });
    this.agHelper.AssertAutoSave();
  }

  EnterHeader(hKey: string, hValue: string) {
    this.SelectPaneTab("Headers");
    this.agHelper.EnterValue(hKey, {
      propFieldName: this._headerKey(0),
      directInput: true,
      inputFieldName: "",
    });
    this.agHelper.PressEscape();
    this.agHelper.EnterValue(hValue, {
      propFieldName: this._headerValue(0),
      directInput: true,
      inputFieldName: "",
    });
    this.agHelper.PressEscape();
    this.agHelper.AssertAutoSave();
  }

  EnterParams(pKey: string, pValue: string) {
    this.SelectPaneTab("Params");
    this.agHelper.EnterValue(pKey, {
      propFieldName: this._paramKey(0),
      directInput: true,
      inputFieldName: "",
    });
    this.agHelper.PressEscape();
    this.agHelper.EnterValue(pValue, {
      propFieldName: this._paramValue(0),
      directInput: true,
      inputFieldName: "",
    });
    this.agHelper.PressEscape();
    this.agHelper.AssertAutoSave();
  }

  EnterBodyFormData(
    subTab: "FORM_URLENCODED" | "MULTIPART_FORM_DATA",
    bKey: string,
    bValue: string,
    type = "",
    toTrash = false,
  ) {
    this.SelectPaneTab("Body");
    this.SelectSubTab(subTab);
    if (toTrash) {
      cy.get(this._trashDelete).click();
      cy.xpath(this._visibleTextSpan("Add more")).click();
    }
    this.agHelper.EnterValue(bKey, {
      propFieldName: this._bodyKey(0),
      directInput: true,
      inputFieldName: "",
    });
    this.agHelper.PressEscape();

    if (type) {
      cy.xpath(this._bodyTypeDropdown)
        .eq(0)
        .click();
      cy.xpath(this._visibleTextDiv(type)).click();
    }
    this.agHelper.EnterValue(bValue, {
      propFieldName: this._bodyValue(0),
      directInput: true,
      inputFieldName: "",
    });
    this.agHelper.PressEscape();
    this.agHelper.AssertAutoSave();
  }

  RunAPI(
    toValidateResponse = true,
    waitTimeInterval = 20,
    validateNetworkAssertOptions?: { expectedPath: string; expectedRes: any },
  ) {
    this.agHelper.GetNClick(this._apiRunBtn, 0, true, waitTimeInterval);
    toValidateResponse &&
      this.agHelper.ValidateNetworkExecutionSuccess("@postExecute");

    // Asserting Network result
    validateNetworkAssertOptions?.expectedPath &&
      validateNetworkAssertOptions?.expectedRes &&
      this.agHelper.ValidateNetworkDataAssert(
        "@postExecute",
        validateNetworkAssertOptions.expectedPath,
        validateNetworkAssertOptions.expectedRes,
      );
  }

  SetAPITimeout(timeout: number) {
    this.SelectPaneTab("Settings");
    cy.xpath(this._queryTimeout)
      .clear()
      .type(timeout.toString(), { delay: 0 }); //Delay 0 to work like paste!
    this.agHelper.AssertAutoSave();
    this.SelectPaneTab("Headers");
  }

  ToggleOnPageLoadRun(enable = true || false) {
    this.SelectPaneTab("Settings");
    if (enable)
      this.agHelper.CheckUncheck(this._onPageLoad, true);
      else this.agHelper.CheckUncheck(this._onPageLoad, false);
  }

  ToggleConfirmBeforeRunningApi(enable = true || false) {
    this.SelectPaneTab("Settings");
    if (enable) this.agHelper.CheckUncheck(this._confirmBeforeRunningAPI, true);
    else this.agHelper.CheckUncheck(this._confirmBeforeRunningAPI, false);
  }

  SelectPaneTab(
    tabName:
      | "Headers"
      | "Params"
      | "Body"
      | "Pagination"
      | "Authentication"
      | "Settings"
      | "Response"
      | "Errors"
      | "Logs"
      | "Inspect entity",
  ) {
    this.agHelper.PressEscape();
    this.agHelper.GetNClick(this._visibleTextSpan(tabName), 0, true);
  }

  SelectSubTab(
    subTabName:
      | "NONE"
      | "JSON"
      | "FORM_URLENCODED"
      | "MULTIPART_FORM_DATA"
      | "RAW",
  ) {
    this.agHelper.GetNClick(this._bodySubTab(subTabName));
  }

  AssertRightPaneSelectedTab(tabName: RightPaneTabs) {
    cy.get(this._rightPaneTab(tabName)).should(
      "have.class",
      "react-tabs__tab--selected",
    );
  }

  SelectRightPaneTab(tabName: RightPaneTabs) {
    this.agHelper.GetNClick(this._rightPaneTab(tabName));
  }

  ValidateQueryParams(param: { key: string; value: string }) {
    this.SelectPaneTab("Params");
    this.agHelper.ValidateCodeEditorContent(this._paramKey(0), param.key);
    this.agHelper.ValidateCodeEditorContent(this._paramValue(0), param.value);
  }

  ValidateHeaderParams(header: { key: string; value: string }) {
    this.SelectPaneTab("Headers");
    this.agHelper.ValidateCodeEditorContent(this._headerKey(0), header.key);
    this.agHelper.ValidateCodeEditorContent(this._headerValue(0), header.value);
  }

  ReadApiResponsebyKey(key: string) {
    let apiResp = "";
    cy.get(this._responseBody)
      .contains(key)
      .siblings("span")
      .invoke("text")
      .then((text) => {
        apiResp = `${text
          .match(/"(.*)"/)![0]
          .split('"')
          .join("")} `;
        cy.log("Key value in api response is :" + apiResp);
        cy.wrap(apiResp).as("apiResp");
      });
  }

  SwitchToResponseTab(tabIdentifier: string) {
    cy.get(tabIdentifier).click();
  }

  public SelectAPIVerb(verb: "GET" | "POST" | "PUT" | "DELETE" | "PATCH") {
    cy.get(this._apiVerbDropdown).click();
    cy.xpath(this._verbToSelect(verb))
      .should("be.visible")
      .click();
  }

  ResponseStatusCheck(statusCode: string) {
    this.agHelper.AssertElementVisible(this._responseStatus);
    cy.get(this._responseStatus).contains(statusCode);
  }
  public SelectPaginationTypeViaIndex(index: number) {
    cy.get(this._paginationTypeLabels)
      .eq(index)
      .click({ force: true });
  }

  CreateAndFillGraphqlApi(url: string, apiName = "", queryTimeout = 10000) {
    this.CreateGraphqlApi(apiName);
    this.EnterURL(url);
    this.agHelper.AssertAutoSave();
    //this.agHelper.Sleep(2000);// Added because api name edit takes some time to reflect in api sidebar after the call passes.
    cy.get(this._apiRunBtn).should("not.be.disabled");
    if (queryTimeout != 10000) this.SetAPITimeout(queryTimeout);
  }

  CreateGraphqlApi(apiName = "") {
    cy.get(this.locator._createNew).click({ force: true });
    cy.get(this._blankGraphqlAPI).click({ force: true });
    this.agHelper.ValidateNetworkStatus("@createNewApi", 201);

    if (apiName) this.agHelper.RenameWithInPane(apiName);
    cy.get(this._resourceUrl).should("be.visible");
  }
}
