import { AggregateHelper } from "./AggregateHelper";
import { CommonLocators } from "../Objects/CommonLocators";
import apiwidget from "../../locators/apiWidgetslocator.json";

const agHelper = new AggregateHelper();
const locator = new CommonLocators();

export class JSEditor {
  private _runButton = "//li//*[local-name() = 'svg' and @class='run-button']";
  private _jsObjName = ".t--js-action-name-edit-field span";
  private _jsObjTxt = ".t--js-action-name-edit-field input";
  private _newJSobj = "span:contains('New JS Object')"
  private _bindingsClose = ".t--entity-property-close"

  public NavigateToJSEditor() {
    cy.get(locator._createNew)
      .last()
      .click({ force: true });
    cy.get(this._newJSobj).click({ force: true });

    //cy.waitUntil(() => cy.get(locator._toastMsg).should('not.be.visible')) // fails sometimes
    agHelper.WaitUntilEleDisappear(locator._toastMsg, 'created successfully', 1000)
  }

  public CreateJSObject(JSCode: string, paste = true, completeReplace = false) {
    this.NavigateToJSEditor();

    if (!completeReplace) {
      cy.get(locator._codeMirrorTextArea)
        .first()
        .focus()
        .type("{downarrow}{downarrow}{downarrow}{downarrow}  ")
    }
    else {
      cy.get(locator._codeMirrorTextArea)
      .first()
      .focus()
      .type("{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}")
      .type("{shift}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}", { force: true })
      .type("{backspace}",{ force: true });

      // .type("{uparrow}", { force: true })
      // .type("{ctrl}{shift}{downarrow}", { force: true })
      // .type("{del}",{ force: true });

      // cy.get(locator._codeEditorTarget).contains('export').click().closest(locator._codeEditorTarget)
      //   .type("{uparrow}", { force: true })
      //   .type("{ctrl}{shift}{downarrow}", { force: true })
      //   .type("{backspace}",{ force: true });
      //.type("{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow} ")

      }

    cy.get(locator._codeMirrorTextArea)
      .first()
      .then((el: any) => {
        const input = cy.get(el);
        if (paste) {
          //input.invoke("val", value);
          agHelper.Paste(el, JSCode)
        } else {
          input.type(JSCode, {
            parseSpecialCharSequences: false, delay: 150
          });
        }
      });

    agHelper.WaitAutoSave()//Ample wait due to open bug # 10284
    agHelper.Sleep(5000)//Ample wait due to open bug # 10284

    //clicking 1 times & waits for 3 second for result to be populated!
    Cypress._.times(1, () => {
      cy.xpath(this._runButton)
        .first()
        .click()
        .wait(3000)
    })
    cy.get(locator._empty).should('not.exist')
    cy.get(locator._toastMsg).should("have.length", 0)
    this.GetJSObjectName()
  }

  public EnterJSContext(endp: string, value: string, paste = true, toToggleOnJS = false) {
    if (toToggleOnJS) {
      cy.get(locator._jsToggle(endp))
        .invoke("attr", "class")
        .then((classes: any) => {
          if (!classes.includes("is-active")) {
            cy.get(locator._jsToggle(endp))
              .first()
              .click({ force: true });
          }
        });
    }
    cy.get(locator._propertyControl + endp + " " + locator._codeMirrorTextArea)
      .first()
      .focus()
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}", { force: true })
      .type("{del}", { force: true });

    cy.focused().then(($cm: any) => {
      if ($cm.contents != "") {
        cy.log("The field is not empty");
        cy.get(locator._propertyControl + endp + " " + locator._codeMirrorTextArea)
          .first()
          .click({ force: true })
          .focused()
          .clear({
            force: true,
          });
      }
      agHelper.Sleep()
      cy.get(locator._propertyControl + endp + " " + locator._codeMirrorTextArea)
        .first()
        .then((el: any) => {
          const input = cy.get(el);
          if (paste) {
            //input.invoke("val", value);
            agHelper.Paste(el, value)
          } else {
            input.type(value, {
              parseSpecialCharSequences: false,
            });
          }
        });
    });
    agHelper.WaitAutoSave()//Allowing time for Evaluate value to capture value
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

  public GetJSObjectName() {
    cy.get(this._jsObjName).invoke("text").then((text) => cy.wrap(text).as("jsObjName")
    );
  }

  public validateDefaultJSObjProperties(jsObjName: string) {
    agHelper.ActionContextMenuByEntityName(jsObjName, "Show Bindings");
    cy.get(apiwidget.propertyList).then(function ($lis) {
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
    });
    cy.get(this._bindingsClose).click({ force: true });
  }

}
