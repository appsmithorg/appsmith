import { AggregateHelper } from "./AggregateHelper";
import { CommonLocators } from "../Objects/CommonLocators";
import apiwidget from "../../locators/apiWidgetslocator.json";

const agHelper = new AggregateHelper();
const locator = new CommonLocators();

export class JSEditor {
  private _runButton =
    "//li//*[local-name() = 'svg' and @class='run-button']/parent::li";
  private _outputConsole = ".CodeEditorTarget";
  private _jsObjName = ".t--js-action-name-edit-field span";
  private _jsObjTxt = ".t--js-action-name-edit-field input";

  public NavigateToJSEditor() {
    cy.get(".t--entity-add-btn.group.files").click({ force: true });
    cy.get("span:contains('New JS Object')").click({ force: true });
  }

  public CreateJSObject(JSCode: string, paste = true) {
    this.NavigateToJSEditor();
    agHelper.Sleep();
    cy.get(locator._codeMirrorTextArea)
      .first()
      .focus()
      .type("{downarrow}{downarrow}{downarrow}{downarrow}  ");

    cy.get(locator._codeMirrorTextArea)
      .first()
      .then((el: any) => {
        const input = cy.get(el);
        if (paste) {
          //input.invoke("val", value);
          agHelper.Paste(el, JSCode);
        } else {
          input.type(JSCode, {
            parseSpecialCharSequences: false,
          });
        }
      });

    //cy.waitUntil(() => cy.get(locator._toastMsg).should('not.be.visible')) // fails sometimes
    agHelper.WaitUntilEleDisappear(
      locator._toastMsg,
      "created successfully",
      2000,
    );
    Cypress._.times(3, () => {
      cy.xpath(this._runButton)
        .first()
        .click()
        .wait(1000);
    }); //clicking 3 times each with interval of 1 second!
    cy.get(locator._empty).should("not.exist");
    cy.get(locator._toastMsg).should("have.length", 0);
  }

  public EnterJSContext(
    endp: string,
    value: string,
    paste = true,
    toToggleOnJS = false,
  ) {
    if (toToggleOnJS) {
      cy.get(locator._jsToggle(endp))
        .first()
        .click({ force: true });
    }
    cy.get(locator._propertyControl + endp + " " + locator._codeMirrorTextArea)
      .first()
      .focus()
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}", { force: true });
    cy.focused().then(($cm: any) => {
      if ($cm.contents != "") {
        cy.log("The field is not empty");
        cy.get(
          locator._propertyControl + endp + " " + locator._codeMirrorTextArea,
        )
          .first()
          .click({ force: true })
          .focused()
          .clear({
            force: true,
          });
      }
      agHelper.Sleep();
      cy.get(
        locator._propertyControl + endp + " " + locator._codeMirrorTextArea,
      )
        .first()
        .then((el: any) => {
          const input = cy.get(el);
          if (paste) {
            //input.invoke("val", value);
            agHelper.Paste(el, value);
          } else {
            input.type(value, {
              force: true,
              parseSpecialCharSequences: false,
            });
          }
        });
    });
    agHelper.WaitAutoSave();
    //agHelper.Sleep(2500);//Allowing time for Evaluate value to capture value
  }

  public RenameJSObjFromForm(renameVal: string) {
    cy.get(this._jsObjName).click({ force: true });
    cy.get(this._jsObjTxt)
      .clear()
      .type(renameVal, { force: true })
      .should("have.value", renameVal)
      .blur();
    agHelper.Sleep(); //allowing time for name change to reflect in EntityExplorer
  }

  public RenameJSObjFromExplorer(entityName: string, renameVal: string) {
    agHelper.ActionContextMenuByEntityName("RenamedJSObject", "Edit Name");
    cy.xpath(locator._entityNameEditing(entityName)).type(
      renameVal + "{enter}",
    );
    agHelper.ValidateEntityPresenceInExplorer(renameVal);
    agHelper.Sleep(); //allowing time for name change to reflect in EntityExplorer
  }

  public validateDefaultJSObjProperties(jsObjName: string) {
    agHelper.ActionContextMenuByEntityName(jsObjName, "Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(4);
      expect($lis.eq(0).text()).to.be.oneOf([
        "{{" + jsObjName + ".myFun2()}}",
        "{{" + jsObjName + ".myFun1()}}",
      ]);
      expect($lis.eq(1).text()).to.be.oneOf([
        "{{" + jsObjName + ".myFun2()}}",
        "{{" + jsObjName + ".myFun1()}}",
      ]);
      expect($lis.eq(2).text()).to.contain("{{" + jsObjName + ".myVar1}}");
      expect($lis.eq(3).text()).to.contain("{{" + jsObjName + ".myVar2}}");
      cy.get(".t--entity-property-close").click({ force: true });
    });
  }
}
