import datasourceFormData from "../../fixtures/datasources.json";
import { ObjectsRegistry } from "../Objects/Registry";

const DataSourceKVP = {
  Postgres: "PostgreSQL",
  Mongo: "MongoDB",
  MySql: "MySQL",
}; //DataSources KeyValuePair

export class DataSources {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private table = ObjectsRegistry.Table;
  private ee = ObjectsRegistry.EntityExplorer;
  private locator = ObjectsRegistry.CommonLocators;

  private _dsCreateNewTab = "[data-cy=t--tab-CREATE_NEW]";
  private _addNewDataSource = ".t--entity-add-btn.datasources";
  private _createNewPlgin = (pluginName: string) =>
    ".t--plugin-name:contains('" + pluginName + "')";
  private _collapseContainer = ".t--collapse-section-container";
  private _host = "input[name='datasourceConfiguration.endpoints[0].host']";
  private _port = "input[name='datasourceConfiguration.endpoints[0].port']";
  _databaseName =
    "input[name='datasourceConfiguration.authentication.databaseName']";
  private _username =
    "input[name='datasourceConfiguration.authentication.username']";
  private _sectionAuthentication = "[data-cy=section-Authentication]";
  private _password =
    "input[name = 'datasourceConfiguration.authentication.password']";
  private _testDs = ".t--test-datasource";
  private _saveDs = ".t--save-datasource";
  private _saveAndAuthorizeDS = ".t--save-and-authorize-datasource";
  private _datasourceCard = ".t--datasource";
  _editButton = ".t--edit-datasource";
  _dsEntityItem = "[data-guided-tour-id='explorer-entity-Datasources']";
  _activeDS = "[data-testid='active-datasource-name']";
  _templateMenu = ".t--template-menu";
  _templateMenuOption = (action: string) =>
    "//div[contains(@class, 't--template-menu')]//div[text()='" + action + "']";
  private _createQuery = ".t--create-query";
  _visibleTextSpan = (spanText: string) =>
    "//span[contains(text(),'" + spanText + "')]";
  _dropdownTitle = (ddTitle: string) =>
    "//p[contains(text(),'" +
    ddTitle +
    "')]/ancestor::div[@class='form-config-top']/following-sibling::div[@class='t--form-control-DROP_DOWN']//div[@role='listbox']";
  _reconnectModal = "div.reconnect-datasource-modal";
  _activeDSListReconnectModal = (dbName: string) =>
    "//div[contains(@class, 't--ds-list')]//span[text()='" + dbName + "']";
  _runQueryBtn = ".t--run-query";
  _newDatabases = "#new-datasources";
  _newDatasourceContainer = "#new-integrations-wrapper";
  _selectDatasourceDropdown = "[data-cy=t--datasource-dropdown]";
  _selectTableDropdown = "[data-cy=t--table-dropdown]";
  _selectSheetNameDropdown = "[data-cy=t--sheetName-dropdown]";
  _selectTableHeaderIndexInput = "[data-cy=t--tableHeaderIndex]";
  _dropdownOption = ".bp3-popover-content .t--dropdown-option";
  _generatePageBtn = "[data-cy=t--generate-page-form-submit]";
  _selectedRow = ".tr.selected-row";
  _activeTab = "span:contains('Active')";
  _contextMenuDatasource = "span[name='comment-context-menu']";
  _contextMenuDelete = ".t--datasource-option-delete";
  _datasourceCardGeneratePageBtn = ".t--generate-template";
  _queryTableResponse =
    "//div[@data-guided-tour-id='query-table-response']//div[@class='tbody']//div[@class ='td']";
  _queryResponseHeader = (header: string) =>
    "//div[@data-guided-tour-id='query-table-response']//div[@class='table']//div[@role ='columnheader']//span[text()='" +
    header +
    "']";
  _refreshIcon = "button .bp3-icon-refresh";
  _addIcon = "button .bp3-icon-add";
  _queryError = "span.t--query-error";
  _queryResponse = (responseType: string) =>
    "li[data-cy='t--tab-" + responseType + "']";
  _queryRecordResult = (recordCount: number) =>
    `//div/span[text()='Result:']/span[contains(text(),' ${recordCount} Record')]`;
  _noRecordFound = "span[data-testid='no-data-table-message']";
  _usePreparedStatement =
    "input[name='actionConfiguration.pluginSpecifiedTemplates[0].value'][type='checkbox']";
  _queriesOnPageText = (dsName: string) =>
    ".t--datasource-name:contains('" + dsName + "') .t--queries-for-DB";
  _mockDB = (dbName: string) =>
    "//span[text()='" +
    dbName +
    "']/ancestor::div[contains(@class, 't--mock-datasource')][1]";
  private _createGraphQLDatasource = ".t--createBlankApi-graphql-plugin";
  _graphqlQueryEditor = ".t--graphql-query-editor .CodeMirror textarea";
  _graphqlVariableEditor = ".t--graphql-variable-editor .CodeMirror textarea";
  _graphqlPagination = {
    _limitVariable: ".t--apiFormPaginationLimitVariable",
    _limitValue: ".t--apiFormPaginationLimitValue .CodeMirror textarea",
    _offsetVariable: ".t--apiFormPaginationOffsetVariable",
    _offsetValue: ".t--apiFormPaginationOffsetValue .CodeMirror textarea",
    _prevLimitVariable: ".t--apiFormPaginationPrevLimitVariable",
    _prevLimitValue: ".t--apiFormPaginationPrevLimitValue .CodeMirror textarea",
    _prevCursorVariable: ".t--apiFormPaginationPrevCursorVariable",
    _prevCursorValue:
      ".t--apiFormPaginationPrevCursorValue .CodeMirror textarea",
    _nextLimitVariable: ".t--apiFormPaginationNextLimitVariable",
    _nextLimitValue: ".t--apiFormPaginationNextLimitValue .CodeMirror textarea",
    _nextCursorVariable: ".t--apiFormPaginationNextCursorVariable",
    _nextCursorValue:
      ".t--apiFormPaginationNextCursorValue .CodeMirror textarea",
  };
  _queryDoc = ".t--datasource-documentation-link";
  _globalSearchModal = ".t--global-search-modal";
  _globalSearchInput = (inputText: string) =>
    "//input[@id='global-search'][@value='" + inputText + "']";
  _gsScopeDropdown =
    "[data-cy='datasourceConfiguration.authentication.scopeString']";
  _gsScopeOptions = ".ads-dropdown-options-wrapper div > span div span";
  private _queryTimeout =
    "//input[@name='actionConfiguration.timeoutInMillisecond']";
  _getStructureReq = "/api/v1/datasources/*/structure?ignoreCache=true";
  public _datasourceModalSave = ".t--datasource-modal-save";
  public _datasourceModalDoNotSave = ".t--datasource-modal-do-not-save";

  public AssertViewMode() {
    this.agHelper.AssertElementExist(this._editButton);
  }

  public AssertEditMode() {
    this.agHelper.AssertElementAbsence(this._editButton);
  }

  public StartDataSourceRoutes() {
    cy.intercept("POST", "/api/v1/datasources").as("saveDatasource");
    cy.intercept("POST", "/api/v1/datasources/test").as("testDatasource");
    cy.intercept("PUT", "/api/v1/datasources/*").as("updateDatasource");
  }

  private ReplaceApplicationIdForInterceptPages(fixtureFile: any) {
    let currentAppId, currentURL;
    cy.readFile(
      fixtureFile,
      // (err: string) => {
      // if (err) {
      //   return console.error(err);
      // }}
    ).then((data) => {
      cy.url().then((url) => {
        currentURL = url;
        const myRegexp = /applications(.*)/;
        const match = myRegexp.exec(currentURL);
        cy.log(currentURL + "currentURL from intercept is");
        currentAppId = match ? match[1].split("/")[1] : null;
        data.data.page.applicationId = currentAppId;
        cy.writeFile(fixtureFile, JSON.stringify(data));
      });
    });
  }

  public StartInterceptRoutesForMySQL() {
    //All stubbing - updating app id to current app id for Delete app by api call to be successfull:

    this.ReplaceApplicationIdForInterceptPages(
      "cypress/fixtures/mySQL_PUT_replaceLayoutWithCRUD.json",
    );

    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.intercept("GET", "/api/v1/datasources/*/structure?ignoreCache=*", {
      fixture: "mySQL_GET_selectTableDropdown.json",
    }).as("getDatasourceStructure");
    cy.intercept("PUT", "/api/v1/pages/crud-page/*", {
      fixture: "mySQL_PUT_replaceLayoutWithCRUD.json",
    }).as("replaceLayoutWithCRUDPage");
    cy.intercept("GET", "/api/v1/actions*", {
      fixture: "mySQL_GET_Actions.json",
    }).as("getActions");
    cy.intercept("POST", "/api/v1/actions/execute", {
      fixture: "mySQL_POST_Execute.json",
    }).as("postExecute");
    cy.intercept("POST", "/api/v1/pages/crud-page", {
      fixture: "mySQL_PUT_replaceLayoutWithCRUD.json",
    }).as("replaceLayoutWithCRUDPage");
  }

  public StartInterceptRoutesForMongo() {
    //All stubbing
    this.ReplaceApplicationIdForInterceptPages(
      "cypress/fixtures/mongo_PUT_replaceLayoutWithCRUD.json",
    );

    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
    cy.intercept("GET", "/api/v1/datasources/*/structure?ignoreCache=*", {
      fixture: "mongo_GET_selectTableDropdown.json",
    }).as("getDatasourceStructure");
    cy.intercept("PUT", "/api/v1/pages/crud-page/*", {
      fixture: "mongo_PUT_replaceLayoutWithCRUD.json",
    }).as("replaceLayoutWithCRUDPage");
    cy.intercept("GET", "/api/v1/actions*", {
      fixture: "mongo_GET_Actions.json",
    }).as("getActions");
    cy.intercept("POST", "/api/v1/actions/execute", {
      fixture: "mongo_POST_Actions.json",
    }).as("postExecute");
    cy.intercept("POST", "/api/v1/pages/crud-page", {
      fixture: "mongo_PUT_replaceLayoutWithCRUD.json",
    }).as("post_replaceLayoutCRUDStub");
  }

  public StartInterceptRoutesForFirestore() {
    //All stubbing
    cy.intercept("POST", "/api/v1/datasources/test", {
      fixture: "testAction.json",
    }).as("testDatasource");
  }

  public CreatePlugIn(pluginName: string, waitForToastDisappear = false) {
    cy.get(this._createNewPlgin(pluginName))
      .parent("div")
      .trigger("click", { force: true });
    this.agHelper.Sleep();
    //this.agHelper.WaitUntilEleAppear(this.locator._toastMsg);
    this.agHelper.AssertElementAbsence(
      this.locator._specificToast("Duplicate key error"),
    );
    this.agHelper.PressEscape();
    // if (waitForToastDisappear)
    //   this.agHelper.WaitUntilToastDisappear("datasource created");
    // else this.agHelper.AssertContains("datasource created");
  }

  public EditDatasource() {
    this.agHelper.GetNClick(this._editButton);
  }

  public ExpandSection(index: number) {
    cy.get(this._collapseContainer)
      .eq(index)
      .click();
    cy.get(this._collapseContainer)
      .eq(index)
      .find(this.locator._chevronUp)
      .should("be.visible");
  }

  public ExpandSectionByName(locator: string) {
    // Click on collapse section only if it collapsed, if it is expanded
    // we ignore
    cy.get(`${locator} span`)
      .invoke("attr", "icon")
      .then((iconName) => {
        if (iconName === "chevron-down") {
          cy.get(locator).click();
        }
      });
  }

  public AssertSectionCollapseState(index: number, collapsed = false) {
    cy.get(this._collapseContainer)
      .eq(index)
      .within(() => {
        if (collapsed) {
          cy.get(this.locator._chevronUp).should("not.exist");
        } else {
          cy.get(this.locator._chevronUp).should("exist");
        }
      });
  }

  public NavigateToDSCreateNew() {
    this.agHelper.GetNClick(this._addNewDataSource);
    // cy.get(this._dsCreateNewTab)
    //   .should("be.visible")
    //   .click({ force: true });
    cy.get(this._newDatasourceContainer).scrollTo("bottom");
    cy.get(this._newDatabases).should("be.visible");
  }

  CreateMockDB(dbName: "Users" | "Movies"): Cypress.Chainable<string> {
    this.NavigateToDSCreateNew();
    this.agHelper.GetNClick(this._mockDB(dbName));
    return cy
      .wait("@getMockDb")
      .then(($createdMock) => $createdMock.response?.body.data.name);
  }

  public FillPostgresDSForm(
    shouldAddTrailingSpaces = false,
    username = "",
    password = "",
  ) {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-host"] + "  "
      : datasourceFormData["postgres-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-databaseName"] + "  "
      : datasourceFormData["postgres-databaseName"];
    cy.get(this._host).type(hostAddress);
    cy.get(this._port).type(datasourceFormData["postgres-port"].toString());
    cy.get(this._databaseName)
      .clear()
      .type(databaseName);
    this.ExpandSectionByName(this._sectionAuthentication);
    cy.get(this._username).type(
      username == "" ? datasourceFormData["postgres-username"] : username,
    );
    cy.get(this._password).type(
      password == "" ? datasourceFormData["postgres-password"] : password,
    );
  }

  public FillMongoDSForm(shouldAddTrailingSpaces = false) {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mongo-host"] + "  "
      : datasourceFormData["mongo-host"];
    cy.get(this._host).type(hostAddress);
    cy.get(this._port).type(datasourceFormData["mongo-port"].toString());
    this.ExpandSectionByName(this._sectionAuthentication);
    cy.get(this._databaseName)
      .clear()
      .type(datasourceFormData["mongo-databaseName"]);
  }

  public FillMySqlDSForm(shouldAddTrailingSpaces = false) {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-host"] + "  "
      : datasourceFormData["mysql-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-databaseName"] + "  "
      : datasourceFormData["mysql-databaseName"];
    cy.get(this._host).type(hostAddress);
    cy.get(this._port).type(datasourceFormData["mysql-port"].toString());
    cy.get(this._databaseName)
      .clear()
      .type(databaseName);
    this.ExpandSectionByName(this._sectionAuthentication);
    cy.get(this._username).type(datasourceFormData["mysql-username"]);
    cy.get(this._password).type(datasourceFormData["mysql-password"]);
  }

  public FillGraphQLDSForm(datasourceName?: string) {
    if (datasourceName) {
      // Change the Graphql Datasource name
      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(datasourceName, { force: true })
        .should("have.value", datasourceName)
        .blur();
    }

    // Adding Graphql Url
    cy.get("input[name='url']").type(datasourceFormData.graphqlApiUrl);
  }

  public FillFirestoreDSForm() {
    cy.xpath(this.locator._inputFieldByName("Database URL") + "//input").type(
      datasourceFormData["database-url"],
    );
    cy.xpath(this.locator._inputFieldByName("Project Id") + "//input").type(
      datasourceFormData["projectID"],
    );
    cy.xpath(
      this.locator._inputFieldByName("Service Account Credentials") + "//input",
    ).type(datasourceFormData["serviceAccCredentials"]);
  }

  public TestSaveDatasource(expectedRes = true) {
    this.TestDatasource(expectedRes);
    this.SaveDatasource();
  }

  public TestDatasource(expectedRes = true) {
    this.agHelper.GetNClick(this._testDs, 0, false, 0);
    this.agHelper.ValidateNetworkDataSuccess("@testDatasource", expectedRes);
    this.agHelper.AssertContains("datasource is valid");
  }

  public SaveDatasource() {
    this.agHelper.GetNClick(this._saveDs);
    this.agHelper.ValidateNetworkStatus("@saveDatasource", 201);
    this.agHelper.AssertContains("datasource created");

    // cy.wait("@saveDatasource")
    //     .then((xhr) => {
    //         cy.log(JSON.stringify(xhr.response!.body));
    //     }).should("have.nested.property", "response.body.responseMeta.status", 200);
  }

  public AuthAPISaveAndAuthorize() {
    cy.get(this._saveAndAuthorizeDS).click();
    this.agHelper.ValidateNetworkStatus("@saveDatasource", 201);
  }

  public updateDatasource() {
    this.agHelper.GetNClick(this._saveDs);
    // this.agHelper.ValidateNetworkStatus("@updateDatasource", 200);
    this.agHelper.AssertContains("datasource updated");
  }

  public DeleteDatasouceFromActiveTab(
    datasourceName: string,
    expectedRes = 200,
  ) {
    this.NavigateToActiveTab();
    cy.get(this._datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(this._datasourceCard)
      .within(() => {
        cy.get(this._contextMenuDatasource).click({ force: true });
      });
    this.agHelper.GetNClick(this._contextMenuDelete);
    this.agHelper.GetNClick(this._visibleTextSpan("Are you sure?"));
    this.agHelper.ValidateNetworkStatus("@deleteDatasource", expectedRes);
    if (expectedRes == 200)
      this.agHelper.AssertContains("datasource deleted successfully");
    else this.agHelper.AssertContains("action(s) using it.");
  }

  public DeleteDatasouceFromWinthinDS(
    datasourceName: string,
    expectedRes = 200,
  ) {
    this.NavigateToActiveTab();
    cy.get(this._datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .click();
    this.agHelper.Sleep(2000); //for the Datasource page to open
    //this.agHelper.ClickButton("Delete");
    this.agHelper.GetNClick(this.locator._visibleTextSpan("Delete"));
    this.agHelper.GetNClick(this.locator._visibleTextSpan("Are you sure?"));
    this.agHelper.ValidateNetworkStatus("@deleteDatasource", expectedRes);
    if (expectedRes == 200)
      this.agHelper.AssertContains("datasource deleted successfully");
    else this.agHelper.AssertContains("action(s) using it.");
  }

  public DeleteDSDirectly() {
    this.agHelper.GetNClick(this.locator._visibleTextSpan("Delete"));
    this.agHelper.GetNClick(this.locator._visibleTextSpan("Are you sure?"));
    this.agHelper.AssertContains("deleted successfully");
  }

  public NavigateToActiveTab() {
    this.NavigateToDSCreateNew();
    this.agHelper.GetNClick(this._activeTab);
  }

  public NavigateFromActiveDS(datasourceName: string, createQuery: boolean) {
    const btnLocator =
      createQuery == true
        ? this._createQuery
        : this._datasourceCardGeneratePageBtn;

    this.ee.NavigateToSwitcher("explorer");
    this.ee.ExpandCollapseEntity("Datasources", false);
    //this.ee.SelectEntityByName(datasourceName, "Datasources");
    //this.ee.ExpandCollapseEntity(datasourceName, false);
    this.NavigateToActiveTab();
    cy.get(this._datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(this._datasourceCard)
      .within(() => {
        cy.get(btnLocator).click({ force: true });
      });
    this.agHelper.Sleep(2000); //for the CreateQuery/GeneratePage page to load
  }

  public CreateQuery(datasourceName: string) {
    cy.get(this._datasourceCard, { withinSubject: null })
      .find(this._activeDS)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(this._datasourceCard)
      .within(() => {
        cy.get(this._createQuery).click({ force: true });
      });
    this.agHelper.Sleep(2000); //for the CreateQuery
  }

  DeleteQuery(queryName: string) {
    this.ee.ExpandCollapseEntity("Queries/JS");
    this.ee.ActionContextMenuByEntityName(queryName, "Delete", "Are you sure?");
  }

  public ValidateNSelectDropdown(
    ddTitle: string,
    currentValue = "",
    newValue = "",
  ) {
    let toChange = false;
    if (currentValue)
      cy.xpath(this._visibleTextSpan(currentValue))
        .scrollIntoView()
        .should("be.visible", currentValue + " dropdown value not present");
    if (newValue) toChange = true;
    if (toChange) {
      cy.xpath(this._dropdownTitle(ddTitle)).click(); //to expand the dropdown
      cy.xpath(this._visibleTextSpan(newValue))
        .last()
        .click({ force: true }); //to select the new value
    }
  }

  public ReconnectDataSource(dbName: string, dsName: "PostgreSQL" | "MySQL") {
    this.agHelper.AssertElementVisible(this._reconnectModal);
    cy.xpath(this._activeDSListReconnectModal(dsName)).should("be.visible");
    cy.xpath(this._activeDSListReconnectModal(dbName)).should("be.visible"); //.click()
    this.ValidateNSelectDropdown("Connection Mode", "", "Read / Write");
    if (dsName == "PostgreSQL") this.FillPostgresDSForm();
    else if (dsName == "MySQL") this.FillMySqlDSForm();
    cy.get(this._saveDs).click();
  }

  RunQuery(
    expectedStatus = true,
    toValidateResponse = true,
    waitTimeInterval = 500,
  ) {
    this.agHelper.GetNClick(this._runQueryBtn, 0, true, waitTimeInterval);
    if (toValidateResponse) {
      this.agHelper.Sleep(1000);
      this.agHelper.ValidateNetworkExecutionSuccess(
        "@postExecute",
        expectedStatus,
      );
    }
  }

  public ReadQueryTableResponse(index: number, timeout = 100) {
    //timeout can be sent higher values incase of larger tables
    this.agHelper.Sleep(timeout); //Settling time for table!
    return cy
      .xpath(this._queryTableResponse)
      .eq(index)
      .invoke("text");
  }

  public AssertQueryResponseHeaders(columnHeaders: string[]) {
    columnHeaders.forEach(($header) =>
      this.agHelper.AssertElementVisible(this._queryResponseHeader($header)),
    );
  }

  public AssertJSONFormHeader(
    rowindex: number,
    colIndex: number,
    headerString: string,
    validateCellData: "" | string = "",
    isMongo = false,
  ) {
    let jsonHeaderString = "";
    this.table.ReadTableRowColumnData(rowindex, colIndex).then(($cellData) => {
      if (validateCellData) expect($cellData).to.eq(validateCellData);

      jsonHeaderString =
        isMongo == true
          ? "Update Document " + headerString + ": " + $cellData
          : "Update Row " + headerString + ": " + $cellData;
      this.agHelper
        .GetText(this.locator._jsonFormHeader)
        .then(($header: any) => expect($header).to.eq(jsonHeaderString));
    });
  }

  public ToggleUsePreparedStatement(enable = true || false) {
    if (enable)
      cy.get(this._usePreparedStatement).check({
        force: true,
      });
    else
      cy.get(this._usePreparedStatement).uncheck({
        force: true,
      });

    this.agHelper.AssertAutoSave();
  }

  public EnterQuery(query: string) {
    cy.get(this.locator._codeEditorTarget).then(($field: any) => {
      this.agHelper.UpdateCodeInput($field, query);
    });
    this.agHelper.AssertAutoSave();
    this.agHelper.Sleep(500); //waiting a bit before proceeding!
  }

  public RunQueryNVerifyResponseViews(
    expectedRecordsCount = 1,
    tableCheck = true,
  ) {
    this.RunQuery();
    tableCheck &&
      this.agHelper.AssertElementVisible(this._queryResponse("TABLE"));
    this.agHelper.AssertElementVisible(this._queryResponse("JSON"));
    this.agHelper.AssertElementVisible(this._queryResponse("RAW"));
    this.CheckResponseRecordsCount(expectedRecordsCount);
  }

  public CheckResponseRecordsCount(expectedRecordCount: number) {
    this.agHelper.AssertElementVisible(
      this._queryRecordResult(expectedRecordCount),
    );
  }

  public CreateDataSource(
    dsType: "Postgres" | "Mongo" | "MySql",
    navigateToCreateNewDs = true,
    verifyBeforeSave = true,
  ) {
    let guid: any;
    let dataSourceName = "";
    this.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      navigateToCreateNewDs && this.NavigateToDSCreateNew();
      this.CreatePlugIn(DataSourceKVP[dsType]);
      guid = uid;
      dataSourceName = dsType + " " + guid;
      this.agHelper.RenameWithInPane(dataSourceName, false);
      if (DataSourceKVP[dsType] == "PostgreSQL") this.FillPostgresDSForm();
      else if (DataSourceKVP[dsType] == "MySQL") this.FillMySqlDSForm();
      else if (DataSourceKVP[dsType] == "MongoDB") this.FillMongoDSForm();

      if (verifyBeforeSave) {
        this.TestSaveDatasource();
      } else {
        this.SaveDatasource();
      }
      cy.wrap(dataSourceName).as("dsName");
    });
  }

  public CreateNewQueryInDS(dsName: string, query = "", queryName = "") {
    this.ee.CreateNewDsQuery(dsName);

    if (queryName) this.agHelper.RenameWithInPane(queryName);

    if (query) {
      this.agHelper.GetNClick(this._templateMenu);
      this.EnterQuery(query);
    }
  }

  public CreateGraphqlDatasource(datasourceName: string) {
    this.NavigateToDSCreateNew();
    //Click on Authenticated Graphql API
    cy.get(this._createGraphQLDatasource).click({ force: true });
    //Verify weather Authenticated Graphql Datasource is successfully created.
    // this.agHelper.ValidateNetworkStatus("@saveDatasource", 201);
    this.FillGraphQLDSForm(datasourceName);

    // save datasource
    this.agHelper.GetNClick(this._saveDs);
    this.agHelper.ValidateNetworkStatus("@saveDatasource", 201);
  }

  public UpdateGraphqlQueryAndVariable(options?: {
    query?: string;
    variable?: string;
  }) {
    if (options?.query) {
      cy.get(this._graphqlQueryEditor)
        .first()
        .focus()
        .type("{selectAll}{backspace}", { force: true })
        .type("{backspace}", { force: true })
        .type(options.query);
    }

    if (options?.variable) {
      cy.get(this._graphqlVariableEditor)
        .first()
        .focus()
        .type("{selectAll}{backspace}", { force: true })
        .type("{backspace}", { force: true })
        .type(options.variable);
    }

    this.agHelper.Sleep();
  }

  public UpdateGraphqlPaginationParams(options: {
    limit?: {
      variable: string;
      value: any;
    };
    offset?: {
      variable: string;
      value: any;
    };
  }) {
    if (options.limit) {
      // Select Limit Variable from dropdown
      cy.get(this._graphqlPagination._limitVariable).click({
        force: true,
      });
      cy.get(this._graphqlPagination._limitVariable)
        .contains(options.limit.variable)
        .click({ force: true });

      // Set the Limit Value as 1
      cy.get(this._graphqlPagination._limitValue)
        .first()
        .focus()
        .type(options.limit.value);
    }

    if (options.offset) {
      // Select Offset Variable from dropdown
      cy.get(this._graphqlPagination._offsetVariable).click({
        force: true,
      });
      cy.get(this._graphqlPagination._offsetVariable)
        .contains(options.offset.variable)
        .click({ force: true });

      // Set the Limit Value as 1
      cy.get(this._graphqlPagination._offsetValue)
        .first()
        .focus()
        .type(options.offset.value);
    }

    this.agHelper.Sleep();
  }

  public SetQueryTimeout(queryTimeout = 20000) {
    this.agHelper.GetNClick(this._queryResponse("SETTINGS"));
    cy.xpath(this._queryTimeout)
      .clear()
      .type(queryTimeout.toString(), { delay: 0 }); //Delay 0 to work like paste!
    this.agHelper.AssertAutoSave();
    this.agHelper.GetNClick(this._queryResponse("QUERY"));
  }

  //Update with new password in the datasource conf page
  public updatePassword(newPassword: string) {
    this.ExpandSectionByName(this._sectionAuthentication);
    cy.get(this._password).type(newPassword);
  }

  //Fetch schema from server and validate UI for the updates
  public verifySchema(
    dataSourceName: string,
    schema: string,
    isUpdate = false,
  ) {
    cy.intercept("GET", this._getStructureReq).as("getDSStructure");
    if (isUpdate) {
      this.updateDatasource();
    } else {
      this.SaveDatasource();
    }
    this.ee.ActionContextMenuByEntityName(dataSourceName, "Refresh");
    cy.wait("@getDSStructure").then(() => {
      cy.get(".bp3-collapse-body").contains(schema);
    });
  }

  public SaveDSFromDialog(save = true) {
    this.agHelper.GoBack();
    if (save) {
      this.agHelper.GetNClick(
        this.locator._visibleTextSpan("SAVE"),
        0,
        false,
        0,
      );
      this.agHelper.ValidateNetworkStatus("@saveDatasource", 201);
      this.agHelper.AssertContains("datasource created");
    } else
      this.agHelper.GetNClick(
        this.locator._visibleTextSpan("DON'T SAVE"),
        0,
        false,
        0,
      );
  }
}
