import { AggregateHelper } from "./AggregateHelper";
import { CommonLocators } from "../Objects/CommonLocators";

const agHelper = new AggregateHelper();
const locator = new CommonLocators()

export class JSEditor {

    private _addEntityJSEditor = ".js_actions .t--entity-add-btn"
    private _runButton = ".run-button"
    private _outputConsole = ".CodeEditorTarget"
    private _jsObjName = ".t--js-action-name-edit-field span"
    private _jsObjTxt = ".t--js-action-name-edit-field input"

    public NavigateToJSEditor() {
        cy.get(this._addEntityJSEditor)
            .last()
            .click({ force: true });
    }

    public CreateJSObject(JSCode: string) {
        this.NavigateToJSEditor();
        agHelper.Sleep()
        cy.get(locator._codeMirrorTextArea)
            .first()
            .focus()
            .type("{downarrow}{downarrow}{downarrow}{downarrow}  ")
            .type(JSCode);
        cy.get(this._outputConsole).contains(JSCode);
        agHelper.Sleep();
        cy.get(this._runButton)
            .first()
            .click();
    }

    public EnterJSContext(endp: string, value: string, paste = true) {
        cy.get(locator._propertyControl + endp + " " + locator._codeMirrorTextArea)
            .first()
            .focus()
            .type("{uparrow}", { force: true })
            .type("{ctrl}{shift}{downarrow}", { force: true });
        cy.focused().then(($cm: any) => {
            if ($cm.contents != "") {
                cy.log("The field is not empty");
                cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
                    .first()
                    .click({ force: true })
                    .focused()
                    .clear({
                        force: true,
                    });
            }
            // eslint-disable-next-line cypress/no-unnecessary-waiting
            agHelper.Sleep()
            cy.get(locator._propertyControl + endp + " " + locator._codeMirrorTextArea)
                .first()
                .then((el: any) => {
                    const input = cy.get(el);
                    if (paste) {
                        input.invoke("val", value);
                    } else {
                        input.type(value, {
                            force: true,
                            parseSpecialCharSequences: false,
                        });
                    }
                });
        });
        agHelper.Sleep(2500);//Allowing time for Evaluate value to capture value
    }

    public RenameJSObjFromForm(renameVal: string) {
        cy.get(this._jsObjName).click({ force: true });
        cy.get(this._jsObjTxt)
            .clear()
            .type(renameVal, { force: true })
            .should("have.value", renameVal)
            .blur()
        agHelper.Sleep();//allowing time for name change to reflect in EntityExplorer
    }

    public RenameJSObjFromExplorer(entityName: string, renameVal: string) {
        agHelper.ActionContextMenuByEntityName("RenamedJSObject", "Edit Name")
        cy.xpath(locator._entityNameEditing(entityName))
            .type(renameVal + "{enter}")
        agHelper.ValidateEntityPresenceInExplorer(renameVal)
        agHelper.Sleep();//allowing time for name change to reflect in EntityExplorer
    }

    public validateDefaultJSObjProperties(jsObjName: string) {
        cy.xpath(locator._entityProperties(jsObjName)).then(function ($lis) {
            expect($lis).to.have.length(4);
            expect($lis.eq(0).text()).to.be.oneOf(["{{" + jsObjName + ".myFun2()}}", "{{" + jsObjName + ".myFun1()}}"]);
            expect($lis.eq(1).text()).to.be.oneOf(["{{" + jsObjName + ".myFun2()}}", "{{" + jsObjName + ".myFun1()}}"]);
            expect($lis.eq(2).text()).to.contain("{{" + jsObjName + ".myVar1}}");
            expect($lis.eq(3).text()).to.contain("{{" + jsObjName + ".myVar2}}");
        });
    }
}

