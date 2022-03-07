import { CommonLocators } from "../Objects/CommonLocators";
import datasourceFormData from "../../fixtures/datasources.json";
import { AggregateHelper } from "./AggregateHelper";

const agHelper = new AggregateHelper();
const locator = new CommonLocators();

export class DataSources {

    private _host = "input[name='datasourceConfiguration.endpoints[0].host']"
    private _port = "input[name='datasourceConfiguration.endpoints[0].port']"
    private _databaseName = "input[name='datasourceConfiguration.authentication.databaseName']"
    private _username = "input[name='datasourceConfiguration.authentication.username']"
    private _sectionAuthentication = "[data-cy=section-Authentication]"
    private _password = "input[name = 'datasourceConfiguration.authentication.password']"
    private _testDs = ".t--test-datasource"
    private _saveDs = ".t--save-datasource"
    private _datasourceCard = ".t--datasource"
    _templateMenu = ".t--template-menu"

    public CreatePlugIn(pluginName: string) {
        cy.get(locator._createNewPlgin(pluginName)).click();
    }

    public FillPostgresDSForm(shouldAddTrailingSpaces = false) {
        const hostAddress = shouldAddTrailingSpaces ? datasourceFormData["postgres-host"] + "  " : datasourceFormData["postgres-host"];
        const databaseName = shouldAddTrailingSpaces ? datasourceFormData["postgres-databaseName"] + "  " : datasourceFormData["postgres-databaseName"];
        cy.get(this._host).type(hostAddress);
        cy.get(this._port).type(datasourceFormData["postgres-port"].toString());
        cy.get(this._databaseName).clear().type(databaseName);
        cy.get(this._sectionAuthentication).click();
        cy.get(this._username).type(datasourceFormData["postgres-username"]);
        cy.get(this._password).type(datasourceFormData["postgres-password"]);
    }

    public TestSaveDatasource(expectedRes = true) {
        this.TestDatasource(expectedRes);
        this.SaveDatasource();
    }

    public TestDatasource(expectedRes = true) {
        cy.get(this._testDs).click();
        cy.wait("@testDatasource").should(
            "have.nested.property",
            "response.body.data.success",
            expectedRes,
        );
    }

    public SaveDatasource() {
        cy.get(this._saveDs).click();
        cy.wait("@saveDatasource")
            .then((xhr) => {
                cy.log(JSON.stringify(xhr.response!.body));
            }).should("have.nested.property", "response.body.responseMeta.status", 200);
    }

    public NavigateToActiveDSQueryPane(datasourceName: string) {
        agHelper.NavigateToDSAdd()
        agHelper.GetNClick(locator._activeTab)
        cy.get(this._datasourceCard)
            .contains(datasourceName)
            .scrollIntoView()
            .should("be.visible")
            .closest(this._datasourceCard)
            .within(() => {
                cy.get(locator._createQuery).click({ force: true });
            })
        agHelper.Sleep(2000); //for the CreateQuery page to load
    }
}