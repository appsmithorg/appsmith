import 'cypress-wait-until';
const uuid = require("uuid");
import { CommonLocators } from "../Objects/CommonLocators";

const locator = new CommonLocators();
export class AggregateHelper {

    public AddDsl(dsl: string) {
        let currentURL;
        let pageid: string;
        let layoutId;
        cy.url().then((url) => {
            pageid = url.split("/")[4]?.split("-").pop() as string;
            cy.log(pageid + "page id");
            //Fetch the layout id
            cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
                const respBody = JSON.stringify(response.body);
                layoutId = JSON.parse(respBody).data.layouts[0].id;
                // Dumping the DSL to the created page
                cy.request(
                    "PUT",
                    "api/v1/layouts/" + layoutId + "/pages/" + pageid,
                    dsl
                ).then((dslDumpResp) => {
                    //cy.log("Pages resposne is : " + dslDumpResp.body);
                    expect(dslDumpResp.status).equal(200);
                    cy.reload();
                });
            });
        });
        this.Sleep(5000)//settling time for dsl
    }

    public NavigateToDSCreateNew() {
        this.NavigateToDSAdd()
        cy.get(locator._integrationCreateNew)
            .should("be.visible")
            .click({ force: true });
        cy.get(locator._loading).should("not.exist");
    }

    public NavigateToDSAdd() {
        cy.get(locator._addNewDataSource).last().scrollIntoView()
            .should("be.visible")
            .click({ force: true });
    }

    public StartServerAndRoutes() {
        cy.intercept("POST", "/api/v1/actions").as("createNewApi");
        cy.intercept("PUT", "/api/v1/actions/*").as("saveAction");
        //cy.intercept("POST", "/api/v1/users/invite", (req) => { req.headers["origin"] = "Cypress";}).as("mockPostInvite");
    }

    public RenameWithInPane(renameVal: string, query = true) {
        let name = query ? locator._queryName : locator._dsName;
        let text = query ? locator._queryNameTxt : locator._dsNameTxt;
        cy.get(name).click({ force: true });
        cy.get(text)
            .clear({ force: true })
            .type(renameVal, { force: true })
            .should("have.value", renameVal)
            .blur();
    }

    public WaitAutoSave() {
        // wait for save query to trigger & n/w call to finish occuring
        cy.get(locator._saveStatusSuccess, { timeout: 40000 }).should("exist");
    }

    public SelectEntityByName(entityNameinLeftSidebar: string) {
        cy.xpath(locator._entityNameInExplorer(entityNameinLeftSidebar), { timeout: 30000 })
            .last()
            .click({ multiple: true })
        this.Sleep()
    }

    public NavigateToExplorer() {
        cy.get(locator._openNavigationTab('explorer')).click()
    }

    public ValidateEntityPresenceInExplorer(entityNameinLeftSidebar: string) {
        cy.xpath(locator._entityNameInExplorer(entityNameinLeftSidebar))
            .should("have.length", 1);
    }

    public ValidateCodeEditorContent(selector: string, contentToValidate: any) {
        cy.get(selector).within(() => {
            cy.get(locator._codeMirrorCode).should("have.text", contentToValidate);
        });
    }

    //refering PublishtheApp from command.js
    public DeployApp() {
        cy.intercept("POST", "/api/v1/applications/publish/*").as("publishApp");
        // Wait before publish
        this.Sleep(2000)
        this.WaitAutoSave()
        // Stubbing window.open to open in the same tab
        cy.window().then((window) => {
            cy.stub(window, "open").callsFake((url) => {
                window.location.href = Cypress.config().baseUrl + url.substring(1);
            });
        });
        cy.get(locator._publishButton).click();
        cy.wait("@publishApp");
        cy.log("Pagename: " + localStorage.getItem("PageName"));
    }

    public expandCollapseEntity(entityName: string, expand = true) {
        cy.xpath(locator._expandCollapseArrow(entityName)).invoke('attr', 'name').then((arrow) => {
            if (expand && arrow == 'arrow-right')
                cy.xpath(locator._expandCollapseArrow(entityName)).trigger('click', { multiple: true }).wait(1000);
            else if (!expand && arrow == 'arrow-down')
                cy.xpath(locator._expandCollapseArrow(entityName)).trigger('click', { multiple: true }).wait(1000);
            else
                this.Sleep()
        })
    }

    public AddNewPage() {
        cy.get(locator._newPage)
            .first()
            .click();
        cy.wait("@createPage").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            201,
        );
    }

    public ClickButton(btnVisibleText: string) {
        cy.xpath(locator._spanButton(btnVisibleText))
            .scrollIntoView()
            .click({ force: true });
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

    public WaitUntilEleDisappear(selector: string, msgToCheckforDisappearance: string, timeout = 1000) {
        cy.waitUntil(() => cy.get(selector).contains(msgToCheckforDisappearance).should("have.length", 0),
            {
                errorMsg: msgToCheckforDisappearance + " did not disappear",
                timeout: 5000,
                interval: 1000
            }).then(() => this.Sleep(timeout))
    }

    public WaitUntilEleAppear(selector: string, timeout = 500) {
        cy.waitUntil(() => cy.get(selector, { timeout: 50000 }).should("have.length.greaterThan", 0),
            {
                errorMsg: "Element did not appear",
                timeout: 5000,
                interval: 1000
            }).then(() => this.Sleep(timeout))
    }

    public ValidateNetworkExecutionSuccess(aliasName: string, expectedRes = true) {
        cy.wait(aliasName).should(
            "have.nested.property",
            "response.body.data.isExecutionSuccess",
            expectedRes,
        )
    }

    public ValidateNetworkStatus(aliasName: string, expectedRes = 200) {
        cy.wait(aliasName).should(
            "have.nested.property",
            "response.body.responseMeta.status",
            expectedRes,
        )
    }

    public ValidateNetworkCallRespPut(aliasName: string, expectedStatus = 200) {
        cy.wait(aliasName).should(
            "have.nested.property",
            "response.body.responseMeta.status",
            expectedStatus,
        )
    }

    public SelectPropertiesDropDown(endp: string, ddOption: string,) {
        cy.xpath(locator._selectPropDropdown(endp))
            .first()
            .scrollIntoView()
            .click()
        cy.get(locator._dropDownValue(ddOption)).click()
    }

    public SelectDropDown(endp: string, ddOption: string,) {
        cy.xpath(locator._selectWidgetDropdown(endp))
            .first()
            .scrollIntoView()
            .click()
        cy.get(locator._selectOptionValue(ddOption)).click({ force: true })
        this.Sleep(2000)
    }

    public EnterActionValue(actionName: string, value: string, paste = true) {
        cy.xpath(locator._actionTextArea(actionName))
            .first()
            .focus()
            .type("{uparrow}", { force: true })
            .type("{ctrl}{shift}{downarrow}{del}", { force: true });
        cy.focused().then(($cm: any) => {
            if ($cm.contents != "") {
                cy.log("The field is not empty");
                cy.xpath(locator._actionTextArea(actionName))
                    .first()
                    .click({ force: true })
                    .focused()
                    .clear({
                        force: true,
                    });
            }
            this.Sleep()
            cy.xpath(locator._actionTextArea(actionName))
                .first()
                .then((el: any) => {
                    const input = cy.get(el);
                    if (paste) {
                        //input.invoke("val", value);
                        this.Paste(el, value)
                    } else {
                        input.type(value, {
                            parseSpecialCharSequences: false,
                        });
                    }
                });
            this.WaitAutoSave()
        })
    }

    public XpathNClick(selector: string) {
        cy.xpath(selector)
            .first()
            .click({ force: true });
        this.Sleep()
    }

    public GetNClick(selector: string) {
        cy.get(selector).click({ force: true });
    }

    public DragDropWidgetNVerify(widgetType: string, x: number, y: number) {
        cy.get(locator._openNavigationTab('widgets')).click({ force: true })
        this.Sleep()
        cy.get(locator._widgetPageIcon(widgetType)).first()
            .trigger("dragstart", { force: true })
            .trigger("mousemove", x, y, { force: true });
        cy.get(locator._dropHere)
            .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
            .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
            .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
        this.WaitAutoSave()//settling time for widget on canvas!
        cy.get(locator._widgetInCanvas(widgetType)).should('exist')
    }

    public ToggleOrDisable(propertyName: string, check = true) {
        if (check) {
            cy.get(locator._propertyToggle(propertyName))
                .check({ force: true })
                .should("be.checked");
        }
        else {
            cy.get(locator._propertyToggle(propertyName))
                .uncheck({ force: true })
                .should("not.checked");
        }
        this.WaitAutoSave()
    }

    public NavigateBacktoEditor() {
        cy.get(locator._backToEditor).click({ force: true });
        this.Sleep(2000)
    }

    public GenerateUUID() {
        let id = uuid.v4();
        id = id.split("-")[0];
        cy.wrap(id).as("guid")
    }

    public GetObjectName() {
        //cy.get(locator._queryName).invoke("text").then((text) => cy.wrap(text).as("queryName")); or below syntax
        return cy.get(locator._queryName).invoke("text");
    }

    public Sleep(timeout = 1000) {
        cy.wait(timeout)
    }

    public NavigateToHome() {
        cy.get(locator._homeIcon).click({ force: true });
        this.Sleep(3000);
        cy.wait("@applications");
        cy.get(locator._homePageAppCreateBtn)
            .should("be.visible")
            .should("be.enabled");
    }

    public CreateNewApplication() {
        cy.get(locator._homePageAppCreateBtn).click({ force: true });
        cy.wait("@createNewApplication").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            201,
        );
    }

    public ActionContextMenuByEntityName(
        entityNameinLeftSidebar: string,
        action = "Delete",
        subAction = "") {
        this.Sleep();
        cy.xpath(locator._contextMenu(entityNameinLeftSidebar))
            .last()
            .click({ force: true });
        cy.xpath(locator._contextMenuItem(action))
            .click({ force: true })
        this.Sleep(500)
        if (subAction) {
            cy.xpath(locator._contextMenuItem(subAction))
                .click({ force: true })
            this.Sleep(500)
        }
    }

    public ValidateEntityAbsenceInExplorer(entityNameinLeftSidebar: string) {
        cy.xpath(locator._entityNameInExplorer(entityNameinLeftSidebar)).should('not.exist');
    }

    public TypeValueNValidate(valueToType: string, fieldName = "") {
        this.EnterValue(valueToType, fieldName)
        this.VerifyEvaluatedValue(valueToType);
    }

    public EnterValue(valueToType: string, fieldName = "") {
        if (fieldName) {
            cy.xpath(locator._inputFieldByName(fieldName)).then(($field: any) => {
                this.UpdateCodeInput($field, valueToType);
            });
        } else {
            cy.get(locator._codeEditorTarget).then(($field: any) => {
                this.UpdateCodeInput($field, valueToType);
            });
        }
    }

    public UpdateCodeInput($selector: string, value: string) {
        cy.get($selector)
            .find(".CodeMirror")
            .first()
            .then((ins: any) => {
                const input = ins[0].CodeMirror;
                input.focus();
                this.Sleep(200)
                input.setValue(value);
                this.Sleep(200)
            });
    }

    public VerifyEvaluatedValue(currentValue: string) {
        this.Sleep(3000);
        cy.get(locator._evaluatedCurrentValue)
            .first()
            .should("be.visible")
            .should("not.have.text", "undefined");
        cy.get(locator._evaluatedCurrentValue)
            .first()
            .click({ force: true })
            .then(($text) => {
                if ($text.text()) expect($text.text()).to.eq(currentValue);
            });
    }

    public ReadTableRowColumnData(rowNum: number, colNum: number) {
        return cy.get(locator._tableRowColumn(rowNum, colNum)).invoke("text");
    }
}