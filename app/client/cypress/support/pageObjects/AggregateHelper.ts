export class AggregateHelper {

    private _addEntityAPI = ".datasources .t--entity-add-btn"
    private _integrationCreateNew = "[data-cy=t--tab-CREATE_NEW]"
    _loading = "#loading"
    private _actionName = ".t--action-name-edit-field span"
    private _actionTxt = ".t--action-name-edit-field input"
    private _entityNameInExplorer = (entityNameinLeftSidebar: string) => "//div[contains(@class, 't--entity-name')][text()='" + entityNameinLeftSidebar + "']"
    private _homeIcon = ".t--appsmith-logo"
    private _homePageAppCreateBtn = ".t--applications-container .createnew"

    public AddDsl(dsl: string) {
        let currentURL;
        let pageid: string;
        let layoutId;
        cy.url().then((url) => {
            currentURL = url;
            const myRegexp = /pages(.*)/;
            const match = myRegexp.exec(currentURL);
            pageid = match![1].split("/")[1];
            cy.log(pageid + "page id");
            //Fetch the layout id
            cy.server()
            cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
                const respBody = JSON.stringify(response.body);
                layoutId = JSON.parse(respBody).data.layouts[0].id;
                // Dumping the DSL to the created page
                cy.request(
                    "PUT",
                    "api/v1/layouts/" + layoutId + "/pages/" + pageid,
                    dsl,
                ).then((response) => {
                    //cy.log("Pages resposne is : " + response.body);
                    expect(response.status).equal(200);
                    cy.reload();
                });
            });
        });
    }

    public NavigateToCreateNewTabPage() {
        cy.get(this._addEntityAPI).last()
            .should("be.visible")
            .click({ force: true });
        cy.get(this._integrationCreateNew)
            .should("be.visible")
            .click({ force: true });
        cy.get(this._loading).should("not.exist");
    }

    public StartServerAndRoutes() {
        cy.intercept("POST", "/api/v1/actions").as("createNewApi");
        cy.intercept("PUT", "/api/v1/actions/*").as("saveAction");
    }

    public RenameWithInPane(renameVal: string) {
        cy.get(this._actionName).click({ force: true });
        cy.get(this._actionTxt)
            .clear()
            .type(renameVal, { force: true })
            .should("have.value", renameVal)
            .blur();
    }

    public WaitAutoSave() {
        // wait for save query to trigger & n/w call to finish occuring
        cy.wait("@saveAction", { timeout: 8000 });
    }

    public SelectEntityByName(entityNameinLeftSidebar: string) {
        cy.xpath(this._entityNameInExplorer(entityNameinLeftSidebar))
            .last()
            .click({ force: true })
            .wait(2000);
    }

    public NavigateToHome() {
        cy.get(this._homeIcon).click({ force: true });
        cy.wait(3000);
        cy.wait("@applications");
        cy.get(this._homePageAppCreateBtn).should("be.visible").should("be.enabled");
        //cy.get(this._homePageAppCreateBtn);
    }

    public CreateNewApplication() {
        cy.get(this._homePageAppCreateBtn).click({ force: true })
        cy.wait("@createNewApplication").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            201,
        );
    }

    public validateCodeEditorContent(selector: string, contentToValidate: any) {
        cy.get(selector).within(() => {
            cy.get(".CodeMirror-code").should("have.text", contentToValidate);
        });
    }
}

