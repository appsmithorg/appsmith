import { AggregateHelper } from "./AggregateHelper";
import { CommonLocators } from "../Objects/CommonLocators";

const agHelper = new AggregateHelper();
const locator = new CommonLocators()

export class JSEditor {

    private _addEntityJSEditor = ".js_actions .t--entity-add-btn"
    private _runButton = ".run-button"


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
                .then((el:any) => {
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
}

