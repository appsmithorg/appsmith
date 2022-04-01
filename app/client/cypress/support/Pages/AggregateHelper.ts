import 'cypress-wait-until';
const uuid = require("uuid");
import { ObjectsRegistry } from '../Objects/Registry';
export class AggregateHelper {
    private locator = ObjectsRegistry.CommonLocators;

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
        cy.get(this.locator._loading).should("not.exist");//Checks the spinner is gone & dsl loaded!
    }

    public StartServerAndRoutes() {
        cy.intercept("POST", "/api/v1/actions").as("createNewApi");
        cy.intercept("PUT", "/api/v1/actions/*").as("saveAction");
        //cy.intercept("POST", "/api/v1/users/invite", (req) => { req.headers["origin"] = "Cypress";}).as("mockPostInvite");
    }

    public RenameWithInPane(renameVal: string, query = true) {
        let name = query ? this.locator._queryName : this.locator._dsName;
        let text = query ? this.locator._queryNameTxt : this.locator._dsNameTxt;
        cy.get(name).click({ force: true });
        cy.get(text)
            .clear({ force: true })
            .type(renameVal, { force: true })
            .should("have.value", renameVal)
            .blur();
    }

    public AssertAutoSave() {
        // wait for save query to trigger & n/w call to finish occuring
        cy.get(this.locator._saveStatusSuccess, { timeout: 40000 }).should("exist");
    }

    public ValidateCodeEditorContent(selector: string, contentToValidate: any) {
        cy.get(selector).within(() => {
            cy.get(this.locator._codeMirrorCode).should("have.text", contentToValidate);
        });
    }

    //refering PublishtheApp from command.js
    public DeployApp() {
        cy.intercept("POST", "/api/v1/applications/publish/*").as("publishApp");
        // Wait before publish
        this.Sleep(2000)
        this.AssertAutoSave()
        // Stubbing window.open to open in the same tab
        cy.window().then((window) => {
            cy.stub(window, "open").callsFake((url) => {
                window.location.href = Cypress.config().baseUrl + url.substring(1);
            });
        });
        cy.get(this.locator._publishButton).click();
        cy.log("Pagename: " + localStorage.getItem("PageName"));
        cy.wait("@publishApp").its("request.url").should("not.contain", "edit")
        //cy.wait('@publishApp').wait('@publishApp') //waitng for 2 calls to complete
    }

    public AddNewPage() {
        cy.get(this.locator._newPage)
            .first()
            .click();
        cy.wait("@createPage").should(
            "have.nested.property",
            "response.body.responseMeta.status",
            201,
        );
    }

    public ValidateToastMessage(text: string, length = 1, index = 1) {
        cy.get(this.locator._toastMsg)
            .should("have.length", length)
            .should("contain.text", text);
    }

    public ClickButton(btnVisibleText: string) {
        cy.xpath(this.locator._spanButton(btnVisibleText))
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

    public WaitUntilEleDisappear(selector: string, msgToCheckforDisappearance: string) {
        cy.waitUntil(() => cy.get(selector).contains(msgToCheckforDisappearance).should("have.length", 0),
            {
                errorMsg: msgToCheckforDisappearance + " did not disappear",
                timeout: 5000,
                interval: 1000
            }).then(() => this.Sleep())
    }

    public WaitUntilEleAppear(selector: string) {
        cy.waitUntil(() => cy.get(selector, { timeout: 50000 }).should("have.length.greaterThan", 0),
            {
                errorMsg: "Element did not appear",
                timeout: 5000,
                interval: 1000
            }).then(() => this.Sleep(500))
    }

    public ValidateNetworkExecutionSuccess(aliasName: string, expectedRes = true) {
        cy.wait(aliasName).should(
            "have.nested.property",
            "response.body.data.isExecutionSuccess",
            expectedRes,
        )
    }

    public ValidateNetworkDataSuccess(aliasName: string, expectedRes = true) {
        cy.wait(aliasName).should(
            "have.nested.property",
            "response.body.data.success",
            expectedRes,
        )
    }

    public ValidateNetworkStatus(aliasName: string, expectedStatus = 200) {
        cy.wait(aliasName).should(
            "have.nested.property",
            "response.body.responseMeta.status",
            expectedStatus,
        )
    }

    public SelectPropertiesDropDown(endp: string, ddOption: string,) {
        cy.xpath(this.locator._selectPropDropdown(endp))
            .first()
            .scrollIntoView()
            .click()
        cy.get(this.locator._dropDownValue(ddOption)).click()
    }

    public SelectDropDown(endp: string, ddOption: string,) {
        cy.xpath(this.locator._selectWidgetDropdown(endp))
            .first()
            .scrollIntoView()
            .click()
        cy.get(this.locator._selectOptionValue(ddOption)).click({ force: true })
        this.Sleep(2000)
    }

    public EnterActionValue(actionName: string, value: string, paste = true) {
        cy.xpath(this.locator._actionTextArea(actionName))
            .first()
            .focus()
            .type("{uparrow}", { force: true })
            .type("{ctrl}{shift}{downarrow}{del}", { force: true });
        cy.focused().then(($cm: any) => {
            if ($cm.contents != "") {
                cy.log("The field is not empty");
                cy.xpath(this.locator._actionTextArea(actionName))
                    .first()
                    .click({ force: true })
                    .focused()
                    .clear({
                        force: true,
                    });
            }
            this.Sleep()
            cy.xpath(this.locator._actionTextArea(actionName))
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
            this.AssertAutoSave()
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

    public ToggleOnOrOff(propertyName: string, toggle: 'On' | 'Off') {
        if (toggle == 'On') {
            cy.get(this.locator._propertyToggle(propertyName))
                .check({ force: true })
                .should("be.checked");
        }
        else {
            cy.get(this.locator._propertyToggle(propertyName))
                .uncheck({ force: true })
                .should("not.checked");
        }
        this.AssertAutoSave()
    }

    public AssertExistingToggleState(propertyName: string, toggle: 'checked' | 'unchecked') {
        cy.xpath(this.locator._propertyToggleValue(propertyName)).invoke("attr", "class")
            .then((classes) => {
                expect(classes).includes(toggle);
            });
    }

    public NavigateBacktoEditor() {
        cy.get(this.locator._backToEditor).click({ force: true });
        this.Sleep(2000)
    }

    public GenerateUUID() {
        let id = uuid.v4();
        id = id.split("-")[0];
        cy.wrap(id).as("guid")
    }

    public GetObjectName() {
        //cy.get(this.locator._queryName).invoke("text").then((text) => cy.wrap(text).as("queryName")); or below syntax
        return cy.get(this.locator._queryName).invoke("text");
    }

    public Sleep(timeout = 1000) {
        cy.wait(timeout)
    }

    public ActionContextMenuWithInPane(action: 'Copy to page' | 'Move to page' | 'Delete', subAction = "") {
        cy.get(this.locator._contextMenuInPane).click()
        cy.xpath(this.locator._visibleTextDiv(action)).should('be.visible').click()
        if (action == 'Delete') {
            cy.xpath(this.locator._visibleTextDiv('Are you sure?')).click()
            this.ValidateNetworkStatus("@deleteAction");
        }
        if (subAction) {
            cy.xpath(this.locator._visibleTextDiv(subAction)).click()
            this.Sleep(500)
        }
    }

    public TypeValueNValidate(valueToType: string, fieldName = "") {
        this.EnterValue(valueToType, fieldName)
        this.VerifyEvaluatedValue(valueToType);
    }

    public EnterValue(valueToType: string, fieldName = "") {
        if (fieldName) {
            cy.xpath(this.locator._inputFieldByName(fieldName)).then(($field: any) => {
                this.UpdateCodeInput($field, valueToType);
            });
        } else {
            cy.get(this.locator._codeEditorTarget).then(($field: any) => {
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
        cy.get(this.locator._evaluatedCurrentValue)
            .first()
            .should("be.visible")
            .should("not.have.text", "undefined");
        cy.get(this.locator._evaluatedCurrentValue)
            .first()
            .click({ force: true })
            .then(($text) => {
                if ($text.text()) expect($text.text()).to.eq(currentValue);
            });
    }

    public EvaluateExistingPropertyFieldValue(fieldName = "", currentValue = "") {
        let toValidate = false;
        if (currentValue) toValidate = true;
        if (fieldName) {
            cy.xpath(this.locator._existingFieldValueByName(fieldName)).eq(0).click();
        } else {
            cy.xpath(this.locator._codeMirrorCode).click();
        }
        this.Sleep(3000); //Increasing wait time to evaluate non-undefined values
        const val = cy
            .get(this.locator._evaluatedCurrentValue)
            .first()
            .should("be.visible")
            .invoke("text");
        if (toValidate) expect(val).to.eq(currentValue);
        return val;
    }

    public UploadFile(fixtureName: string, execStat = true) {
        cy.get(this.locator._uploadFiles).attachFile(fixtureName).wait(1000);
        cy.get(this.locator._uploadBtn).click().wait(3000);
        this.ValidateNetworkExecutionSuccess("@postExecute", execStat);
    }

    public AssertDebugError(label: string, messgae: string) {
        cy.get(this.locator._debuggerIcon)
            .should("be.visible")
            .click({ force: true });
        cy.get(this.locator._errorTab)
            .should("be.visible")
            .click({ force: true });
        cy.get(this.locator._debuggerLabel).eq(0)
            .invoke("text")
            .then(($text) => {
                expect($text).to.eq(label);
            });
        cy.get(this.locator._debugErrorMsg).eq(0)
            .invoke("text")
            .then(($text) => {
                expect($text).contains(messgae);
            });

    }
}