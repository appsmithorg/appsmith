import datasourceFormData from "../../fixtures/datasources.json";
import { ObjectsRegistry } from "../Objects/Registry";
export class DataSources {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locator = ObjectsRegistry.CommonLocators;
  private ee = ObjectsRegistry.EntityExplorer;

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
  private _createQuery = ".t--create-query";
  private _importSuccessModal = ".t--import-app-success-modal";
  private _importSuccessModalClose = ".t--import-success-modal-got-it";
  _visibleTextSpan = (spanText: string) =>
    "//span[contains(text(),'" + spanText + "')]";
  _dropdownTitle = (ddTitle: string) =>
    "//p[contains(text(),'" +
    ddTitle +
    "')]/parent::label/following-sibling::div/div/div";
  _reconnectModal = "div.reconnect-datasource-modal";
  _activeDSListReconnectModal = (dbName: string) =>
    "//div[contains(@class, 't--ds-list')]//span[text()='" + dbName + "']";
  _runQueryBtn = ".t--run-query";
  _newDatabases = "#new-datasources";
  _selectDatasourceDropdown = "[data-cy=t--datasource-dropdown]";
  _datasourceDropdownOption = "[data-cy=t--datasource-dropdown-option]";
  _selectTableDropdown = "[data-cy=t--table-dropdown]";
  _tableDropdownOption = ".bp3-popover-content .t--dropdown-option";
  _generatePageBtn = "[data-cy=t--generate-page-form-submit]";

  public CreatePlugIn(pluginName: string) {
    cy.get(this._createNewPlgin(pluginName)).trigger("click");
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

  public FillPostgresDSForm(shouldAddTrailingSpaces = false) {
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
    cy.get(this._username).type(datasourceFormData["postgres-username"]);
    cy.get(this._password).type(datasourceFormData["postgres-password"]);
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

  public TestSaveDatasource(expectedRes = true) {
    this.TestDatasource(expectedRes);
    this.SaveDatasource();
  }

  public TestDatasource(expectedRes = true) {
    cy.get(this._testDs).click();
    this.agHelper.ValidateNetworkDataSuccess("@testDatasource", expectedRes);
  }

  public SaveDatasource() {
    cy.get(this._saveDs).click();
    this.agHelper.ValidateNetworkStatus("@saveDatasource", 200);

    // cy.wait("@saveDatasource")
    //     .then((xhr) => {
    //         cy.log(JSON.stringify(xhr.response!.body));
    //     }).should("have.nested.property", "response.body.responseMeta.status", 200);
  }

  public NavigateToActiveDSQueryPane(datasourceName: string) {
    this.NavigateToDSCreateNew();
    this.agHelper.GetNClick(this.locator._activeTab);
    cy.get(this._datasourceCard)
      .contains(datasourceName)
      .scrollIntoView()
      .should("be.visible")
      .closest(this._datasourceCard)
      .within(() => {
        cy.get(this._createQuery).click({ force: true });
      });
    this.agHelper.Sleep(2000); //for the CreateQuery page to load
  }

  public NavigateToActiveDSviaEntityExplorer(datasourceName: string) {
    this.ee.SelectEntityByName(datasourceName, "DATASOURCES");
    cy.get(this._createQuery).click({ force: true });
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

  public ReconnectDataSourcePostgres(dbName: string) {
    this.agHelper.AssertElementPresence(this._reconnectModal);
    cy.xpath(this._activeDSListReconnectModal("PostgreSQL")).should(
      "be.visible",
    );
    cy.xpath(this._activeDSListReconnectModal(dbName)).should("be.visible"); //.click()
    this.ValidateNSelectDropdown("Connection Mode", "", "Read / Write");
    this.FillPostgresDSForm();
    cy.get(this._saveDs).click();
    cy.get(this._importSuccessModal).should("be.visible");
    cy.get(this._importSuccessModalClose).click({ force: true });
  }

  RunQuery() {
    cy.get(this._runQueryBtn).click({ force: true });
    this.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
  }
}
