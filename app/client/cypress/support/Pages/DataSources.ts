import datasourceFormData from "../../fixtures/datasources.json";
import { ObjectsRegistry } from "../Objects/Registry";

var DataSourceKVP = {
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
  private _addNewDataSource = ".datasources .t--entity-add-btn";
  private _createNewPlgin = (pluginName: string) =>
    ".t--plugin-name:contains('" + pluginName + "')";
  private _host = "input[name='datasourceConfiguration.endpoints[0].host']";
  private _port = "input[name='datasourceConfiguration.endpoints[0].port']";
  private _databaseName =
    "input[name='datasourceConfiguration.authentication.databaseName']";
  private _username =
    "input[name='datasourceConfiguration.authentication.username']";
  private _sectionAuthentication = "[data-cy=section-Authentication]";
  private _password =
    "input[name = 'datasourceConfiguration.authentication.password']";
  private _testDs = ".t--test-datasource";
  private _saveDs = ".t--save-datasource";
  private _datasourceCard = ".t--datasource";
  _templateMenu = ".t--template-menu";
  _templateMenuOption = (action: string) =>
    "//div[contains(@class, 't--template-menu')]//div[text()='" + action + "']";
  private _createQuery = ".t--create-query";
  _visibleTextSpan = (spanText: string) =>
    "//span[contains(text(),'" + spanText + "')]";
  _dropdownTitle = (ddTitle: string) =>
    "//p[contains(text(),'" +
    ddTitle +
    "')]/ancestor::label/parent::div/following-sibling::div/div/div";
  _reconnectModal = "div.reconnect-datasource-modal";
  _activeDSListReconnectModal = (dbName: string) =>
    "//div[contains(@class, 't--ds-list')]//span[text()='" + dbName + "']";
  _runQueryBtn = ".t--run-query";
  _newDatabases = "#new-datasources";
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
    "//div/span[text()='Result:']/span[contains(text(),'" +
    recordCount +
    " Record')]";
  _noRecordFound = "span[data-testid='no-data-table-message']";
  _usePreparedStatement =
    "input[name='actionConfiguration.pluginSpecifiedTemplates[0].value'][type='checkbox']";
  _queriesOnPageText = (dsName: string) =>
    ".t--datasource-name:contains('" + dsName + "') .t--queries-for-DB";
  _mockDB = (dbName: string) =>
    "//span[text()='" +
    dbName +
    "']/ancestor::div[contains(@class, 't--mock-datasource')][1]";
  _queryDoc = ".t--datasource-documentation-link";
  _globalSearchModal = ".t--global-search-modal";
  _globalSearchInput = (inputText: string) =>
    "//input[@id='global-search'][@value='" + inputText + "']";
  _gsScopeDropdown =
    "[data-cy='datasourceConfiguration.authentication.scopeString']";
  _gsScopeOptions = ".ads-dropdown-options-wrapper div > span div span";

  public StartDataSourceRoutes() {
    cy.intercept("PUT", "/api/v1/datasources/*").as("saveDatasource");
    cy.intercept("POST", "/api/v1/datasources/test").as("testDatasource");
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

  public CreatePlugIn(pluginName: string) {
    cy.get(this._createNewPlgin(pluginName))
      .parent("div")
      .trigger("click", { force: true });
    this.agHelper.WaitUntilToastDisappear("datasource created");
  }

  public NavigateToDSCreateNew() {
    cy.get(this._addNewDataSource)
      .last()
      .scrollIntoView()
      .should("be.visible")
      .click({ force: true });
    // cy.get(this._dsCreateNewTab)
    //   .should("be.visible")
    //   .click({ force: true });
    cy.get(this._newDatabases).should("be.visible");
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
    cy.get(this._sectionAuthentication).click();
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
    cy.get(this._sectionAuthentication).click();
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
    cy.get(this._sectionAuthentication).click();
    cy.get(this._username).type(datasourceFormData["mysql-username"]);
    cy.get(this._password).type(datasourceFormData["mysql-password"]);
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
    cy.get(this._testDs).click();
    this.agHelper.ValidateNetworkDataSuccess("@testDatasource", expectedRes);
    this.agHelper.WaitUntilToastDisappear("datasource is valid");
  }

  public SaveDatasource() {
    cy.get(this._saveDs).click();
    this.agHelper.ValidateNetworkStatus("@saveDatasource", 200);
    this.agHelper.WaitUntilToastDisappear("datasource updated successfully");

    // cy.wait("@saveDatasource")
    //     .then((xhr) => {
    //         cy.log(JSON.stringify(xhr.response!.body));
    //     }).should("have.nested.property", "response.body.responseMeta.status", 200);
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
  }

  public DeleteDatasouceFromWinthinDS(
    datasourceName: string,
    expectedStatus = 200,
  ) {
    this.NavigateToActiveTab();
    cy.get(this._datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .click();
    this.agHelper.Sleep(2000); //for the Datasource page to open
    this.agHelper.ClickButton("Delete");
    this.agHelper.ClickButton("Are you sure?");
    this.agHelper.ValidateNetworkStatus("@deleteDatasource", expectedStatus);
  }

  public NavigateToActiveTab() {
    this.NavigateToDSCreateNew();
    this.agHelper.GetNClick(this._activeTab);
  }

  public NavigateFromActiveDS(datasourceName: string, createQuery: boolean) {
    let btnLocator =
      createQuery == true
        ? this._createQuery
        : this._datasourceCardGeneratePageBtn;

    this.ee.NavigateToSwitcher("explorer");
    this.ee.ExpandCollapseEntity("DATASOURCES", false);
    //this.ee.SelectEntityByName(datasourceName, "DATASOURCES");
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
    cy.get(this._datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(this._datasourceCard)
      .within(() => {
        cy.get(this._createQuery).click({ force: true });
      });
    this.agHelper.Sleep(2000); //for the CreateQuery
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

  RunQuery(expectedStatus = true) {
    cy.get(this._runQueryBtn).click({ force: true });
    this.agHelper.Sleep(2000);
    this.agHelper.ValidateNetworkExecutionSuccess(
      "@postExecute",
      expectedStatus,
    );
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
  }

  public RunQueryNVerifyResponseViews(
    expectdRecordCount = 1,
    tableCheck = true,
  ) {
    this.RunQuery();
    tableCheck &&
      this.agHelper.AssertElementVisible(this._queryResponse("TABLE"));
    this.agHelper.AssertElementVisible(this._queryResponse("JSON"));
    this.agHelper.AssertElementVisible(this._queryResponse("RAW"));
    this.agHelper.AssertElementVisible(
      this._queryRecordResult(expectdRecordCount),
    );
  }

  public CreateDataSource(
    dsType: "Postgres" | "Mongo" | "MySql",
    navigateToCreateNewDs = true,
  ) {
    let guid: any;
    this.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      navigateToCreateNewDs && this.NavigateToDSCreateNew();
      this.CreatePlugIn(DataSourceKVP[dsType]);
      guid = uid;
      this.agHelper.RenameWithInPane(dsType + " " + guid, false);
      if (DataSourceKVP[dsType] == "PostgreSQL") this.FillPostgresDSForm();
      else if (DataSourceKVP[dsType] == "MySQL") this.FillMySqlDSForm();
      else if (DataSourceKVP[dsType] == "MongoDB") this.FillMongoDSForm();
      this.TestSaveDatasource();
      cy.wrap(dsType + " " + guid).as("dsName");
    });
  }

  public CreateNewQueryInDS(
    dsName: string,
    query: string,
    queryName: string = "",
  ) {
    this.ee.CreateNewDsQuery(dsName);
    if (queryName) this.agHelper.RenameWithInPane(queryName);
    this.agHelper.GetNClick(this._templateMenu);
    this.EnterQuery(query);
  }
}
