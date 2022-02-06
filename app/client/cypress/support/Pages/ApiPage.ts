import { AggregateHelper } from "./AggregateHelper";
import explorer from "../../locators/explorerlocators.json";
const agHelper = new AggregateHelper();

export class ApiPage {

    private _createapi = ".t--createBlankApiCard"
    private _resourceUrl = ".t--dataSourceField"
    private _headerKey = (index: number) => ".t--actionConfiguration\\.headers\\[0\\]\\.key\\." + index + ""
    private _headerValue = (index: number) => ".t--actionConfiguration\\.headers\\[0\\]\\.value\\." + index + ""
    private _paramKey = (index: number) => ".t--actionConfiguration\\.queryParameters\\[0\\]\\.key\\." + index + ""
    private _paramValue = (index: number) => ".t--actionConfiguration\\.queryParameters\\[0\\]\\.value\\." + index + ""
    private _paramsTab = "//li//span[text()='Params']"
    private _apiRunBtn = ".t--apiFormRunBtn"
    private _queryTimeout = "//input[@name='actionConfiguration.timeoutInMillisecond']"
    private _apiTab = (tabValue: string) => "span:contains('" + tabValue + "')"
    _responseBody = ".CodeMirror-code  span.cm-string.cm-property"


    CreateAndFillApi(url: string, apiname: string = "", queryTimeout = 30000) {
        cy.get(explorer.createNew).click({ force: true });
        cy.get(explorer.blankAPI).click({ force: true });
        cy.wait("@createNewApi").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            201,
        );
        // cy.get("@createNewApi").then((response: any) => {
        //     expect(response.response.body.responseMeta.success).to.eq(true);
        //     cy.get(agHelper._actionName)
        //         .click()
        //         .invoke("text")
        //         .then((text) => {
        //             const someText = text;
        //             expect(someText).to.equal(response.response.body.data.name);
        //         });
        // }); // to check if Api1 = Api1 when Create Api invoked
        if (apiname)
            agHelper.RenameWithInPane(apiname)
        cy.get(this._resourceUrl).should("be.visible");
        this.EnterURL(url)
        agHelper.WaitAutoSave()
        // Added because api name edit takes some time to
        // reflect in api sidebar after the call passes.
        agHelper.Sleep(2000);
        cy.get(this._apiRunBtn).should("not.be.disabled");
        this.SetAPITimeout(queryTimeout)
    }

    EnterURL(url: string) {
        cy.get(this._resourceUrl)
            .first()
            .click({ force: true })
            .type(url, { parseSpecialCharSequences: false });
        agHelper.WaitAutoSave()
    }

    EnterHeader(hKey: string, hValue: string) {
        cy.get(this._apiTab('Header')).should('be.visible').click();
        cy.get(this._headerKey(0))
            .first()
            .click({ force: true })
            .type(hKey, { parseSpecialCharSequences: false });
        cy.get(this._headerValue(0))
            .first()
            .click({ force: true })
            .type(hValue, { parseSpecialCharSequences: false });
        agHelper.WaitAutoSave()
    }

    EnterParams(pKey: string, pValue: string) {
        cy.xpath(this._paramsTab)
            .should("be.visible")
            .click({ force: true });
        cy.get(this._paramKey(0))
            .first()
            .click({ force: true })
            .type(pKey, { parseSpecialCharSequences: false });
        cy.get(this._paramValue(0))
            .first()
            .click({ force: true })
            .type(pValue, { parseSpecialCharSequences: false });
        agHelper.WaitAutoSave()
    }

    RunAPI() {
        cy.get(this._apiRunBtn).click({ force: true });
        cy.wait("@postExecute").should(
            "have.nested.property",
            "response.body.data.isExecutionSuccess",
            true,
        );
    }

    SetAPITimeout(timeout: number) {
        cy.get(this._apiTab('Settings')).click();
        cy.xpath(this._queryTimeout)
            .clear()
            .type(timeout.toString());

        cy.get(this._apiTab('Header')).click();
    }

    ValidateQueryParams(param: { key: string; value: string; }) {
        cy.xpath(this._paramsTab)
            .should("be.visible")
            .click({ force: true });

        agHelper.ValidateCodeEditorContent(this._paramKey(0), param.key)
        agHelper.ValidateCodeEditorContent(this._paramValue(0), param.value)
    }

    ReadApiResponsebyKey(key: string) {
         let apiResp: string = "";
         cy.get(this._responseBody)
             .contains(key)
             .siblings("span")
             .invoke("text")
             .then((text) => {
                 apiResp = `${text.match(/"(.*)"/)![0].split('"').join("") } `;
                 cy.log("Key value in api response is :" + apiResp);
                 cy.wrap(apiResp).as("apiResp")
             });
    }
}
