import { ObjectsRegistry } from "../Objects/Registry";

export class JSEditor {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;
  public ee = ObjectsRegistry.EntityExplorer;

  //#region Element locators
  private _runButton = "button.run-js-action";
  private _settingsTab = ".tab-title:contains('Settings')";
  private _codeTab = ".tab-title:contains('Code')";
  private _jsObjectParseErrorCallout =
    "//div[contains(@class,'t--js-response-parse-error-call-out')]";
  private _jsFunctionExecutionParseErrorCallout =
    "//div[contains(@class,'t--function-execution-parse-error-call-out')]";
  private _onPageLoadRadioButton = (functionName: string, onLoad: boolean) =>
    `.${functionName}-on-page-load-setting label:contains(${
      onLoad ? "Yes" : "No"
    }) span.checkbox`;
  private _onPageLoadRadioButtonStatus = (
    functionName: string,
    onLoad: boolean,
  ) =>
    `.${functionName}-on-page-load-setting label:contains(${
      onLoad ? "Yes" : "No"
    })>input`;
  private _confirmBeforeExecuteRadioButton = (
    functionName: string,
    shouldConfirm: boolean,
  ) =>
    `.${functionName}-confirm-before-execute label:contains(${
      shouldConfirm ? "Yes" : "No"
    }) span.checkbox`;
  private _confirmBeforeExecuteRadioButtonStatus = (
    functionName: string,
    shouldConfirm: boolean,
  ) =>
    `.${functionName}-confirm-before-execute label:contains(${
      shouldConfirm ? "Yes" : "No"
    })>input`;
  private _outputConsole = ".CodeEditorTarget";
  private _jsObjName = ".t--js-action-name-edit-field span";
  private _jsObjTxt = ".t--js-action-name-edit-field input";
  private _newJSobj = "span:contains('New JS Object')";
  private _bindingsClose = ".t--entity-property-close";
  private _propertyList = ".t--entity-property";
  private _responseTabAction = (funName: string) =>
    "//div[@class='function-name'][text()='" +
    funName +
    "']/following-sibling::div//*[local-name()='svg']";
  private _functionSetting = (settingTxt: string) =>
    "//span[text()='" +
    settingTxt +
    "']/parent::div/following-sibling::input[@type='checkbox']";
  _dialog = (dialogHeader: string) =>
    "//div[contains(@class, 'bp3-dialog')]//h4[contains(text(), '" +
    dialogHeader +
    "')]";
  private _closeSettings = "span[icon='small-cross']";
  _dialogBody = (jsFuncName: string) =>
    "//div[@class='bp3-dialog-body']//*[contains(text(), '" +
    Cypress.env("MESSAGES").QUERY_CONFIRMATION_MODAL_MESSAGE() +
    "')]//*[contains(text(),'" +
    jsFuncName +
    "')]";
  _funcDropdown = ".t--formActionButtons div[role='listbox']";
  _funcDropdownOptions = ".ads-dropdown-options-wrapper div > div";

  //#endregion

  //#region Page functions
  public NavigateToJSEditor() {
    cy.get(this.locator._createNew)
      .last()
      .click({ force: true });
    cy.get(this._newJSobj).click({ force: true });

    // Assert that the name of the JS Object is focused when newly created
    cy.get(this._jsObjTxt)
      .should("be.focused")
      .type("{enter}");

    cy.wait(1000);

    // Assert that the name of the JS Object is no longer in the editable form after pressing "enter"
    cy.get(this._jsObjTxt).should("not.exist");

    //cy.waitUntil(() => cy.get(this.locator._toastMsg).should('not.be.visible')) // fails sometimes
    //this.agHelper.WaitUntilEleDisappear(this.locator._toastMsg, 'created successfully')
    this.agHelper.Sleep();
  }

  public CreateJSObject(
    JSCode: string,
    paste = true,
    completeReplace = false,
    toRun = true,
  ) {
    this.NavigateToJSEditor();

    if (!completeReplace) {
      cy.get(this.locator._codeMirrorTextArea)
        .first()
        .focus()
        .type("{downarrow}{downarrow}{downarrow}{downarrow}  ");
    } else {
      cy.get(this.locator._codeMirrorTextArea)
        .first()
        .focus()
        .type(
          "{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}",
        )
        .type(
          "{shift}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}{uparrow}",
          { force: true },
        )
        .type("{backspace}", { force: true });

      // .type("{uparrow}", { force: true })
      // .type("{ctrl}{shift}{downarrow}", { force: true })
      // .type("{del}",{ force: true });

      // cy.get(this.locator._codthis.eeditorTarget).contains('export').click().closest(this.locator._codthis.eeditorTarget)
      //   .type("{uparrow}", { force: true })
      //   .type("{ctrl}{shift}{downarrow}", { force: true })
      //   .type("{backspace}",{ force: true });
      //.type("{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow} ")
    }

    cy.get(this.locator._codeMirrorTextArea)
      .first()
      .then((el: any) => {
        const input = cy.get(el);
        if (paste) {
          //input.invoke("val", value);
          this.agHelper.Paste(el, JSCode);
        } else {
          input.type(JSCode, {
            parseSpecialCharSequences: false,
            delay: 150,
            force: true,
          });
        }
      });

    this.agHelper.AssertAutoSave(); //Ample wait due to open bug # 10284
    //this.agHelper.Sleep(5000)//Ample wait due to open bug # 10284

    if (toRun) {
      //clicking 1 times & waits for 3 second for result to be populated!
      Cypress._.times(1, () => {
        cy.get(this._runButton)
          .first()
          .click()
          .wait(3000);
      });
      cy.get(this.locator._empty).should("not.exist");
      cy.get(this.locator._toastMsg).should("have.length", 0);
    }
    this.GetJSObjectName();
  }

  //Not working - To improve!
  public EditJSObj(existingTxt: string, newTxt: string) {
    cy.get(this.locator._codeEditorTarget)
      .contains(existingTxt)
      .dblclick(); //.type("{backspace}").type(newTxt)
    cy.get("body")
      .type("{backspace}")
      .type(newTxt);
    this.agHelper.AssertAutoSave(); //Ample wait due to open bug # 10284
  }

  public EnterJSContext(
    endp: string,
    value: string,
    paste = true,
    toToggleOnJS = false,
    notField = false,
  ) {
    if (toToggleOnJS) {
      cy.get(this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()))
        .invoke("attr", "class")
        .then((classes: any) => {
          if (!classes.includes("is-active")) {
            cy.get(
              this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()),
            )
              .first()
              .click({ force: true });
          }
        });
    }
    // cy.get(this.locator._propertyControl + endp + " " + this.locator._codeMirrorTextArea)
    //   .first()
    //   .focus()
    //   //.type("{selectAll}")
    //   .type("{uparrow}{uparrow}", { force: true })
    //   .type("{selectAll}")
    //   // .type("{ctrl}{shift}{downarrow}", { force: true })
    //   .type("{del}", { force: true });

    if (paste) {
      this.agHelper.EnterValue(value, endp, notField);
    } else {
      cy.get(
        this.locator._propertyControl +
          endp.replace(/ +/g, "").toLowerCase() +
          " " +
          this.locator._codeMirrorTextArea,
      )
        .first()
        .then((el: any) => {
          const input = cy.get(el);
          input.type(value, {
            parseSpecialCharSequences: false,
          });
        });
    }

    // cy.focused().then(($cm: any) => {
    //   if ($cm.contents != "") {
    //     cy.log("The field is not empty");
    //     cy.get(this.locator._propertyControl + endp + " " + this.locator._codeMirrorTextArea)
    //       .first()
    //       .click({ force: true })
    //       .type("{selectAll}")
    //       .focused()
    //       .clear({
    //         force: true,
    //       });
    //   }
    //   this.agHelper.Sleep()
    //   cy.get(this.locator._propertyControl + endp + " " + this.locator._codeMirrorTextArea)
    //     .first()
    //     .then((el: any) => {
    //       const input = cy.get(el);
    //       if (paste) {
    //         //input.invoke("val", value);
    //         this.agHelper.Paste(el, value)
    //       } else {
    //         this.agHelper.EnterValue(value, "Table Data")

    //         // input.type(value, {
    //         //   parseSpecialCharSequences: false,
    //         // });
    //       }
    //     });
    // });

    this.agHelper.AssertAutoSave(); //Allowing time for Evaluate value to capture value
  }

  public RemoveText(endp: string) {
    cy.get(
      this.locator._propertyControl +
        endp +
        " " +
        this.locator._codeMirrorTextArea,
    )
      .first()
      .focus()
      .type("{uparrow}", { force: true })
      .type("{ctrl}{shift}{downarrow}", { force: true })
      .type("{del}", { force: true });
    this.agHelper.AssertAutoSave();
  }

  public RenameJSObjFromForm(renameVal: string) {
    cy.get(this._jsObjName).click({ force: true });
    cy.get(this._jsObjTxt)
      .clear()
      .type(renameVal, { force: true })
      .should("have.value", renameVal)
      .blur();
    this.agHelper.Sleep(); //allowing time for name change to reflect in EntityExplorer
  }

  public RenameJSObjFromExplorer(entityName: string, renameVal: string) {
    this.ee.ActionContextMenuByEntityName("RenamedJSObject", "Edit Name");
    cy.xpath(this.locator._entityNameEditing(entityName)).type(
      renameVal + "{enter}",
    );
    this.ee.AssertEntityPresenceInExplorer(renameVal);
    this.agHelper.Sleep(); //allowing time for name change to reflect in EntityExplorer
  }

  public GetJSObjectName() {
    cy.get(this._jsObjName)
      .invoke("text")
      .then((text) => cy.wrap(text).as("jsObjName"));
  }

  public validateDefaultJSObjProperties(jsObjName: string) {
    this.ee.ActionContextMenuByEntityName(jsObjName, "Show Bindings");
    cy.get(this._propertyList).then(function($lis) {
      const bindingsLength = $lis.length;
      expect(bindingsLength).to.be.at.least(4);
      expect($lis.eq(0).text()).to.be.oneOf([
        "{{" + jsObjName + ".myFun2()}}",
        "{{" + jsObjName + ".myFun1()}}",
      ]);
      expect($lis.eq(1).text()).to.be.oneOf([
        "{{" + jsObjName + ".myFun2()}}",
        "{{" + jsObjName + ".myFun1()}}",
        "{{" + jsObjName + ".myFun2.data}}",
        "{{" + jsObjName + ".myFun1.data}}",
      ]);
      expect($lis.eq(bindingsLength - 2).text()).to.contain(
        "{{" + jsObjName + ".myVar1}}",
      );
      expect($lis.eq(bindingsLength - 1).text()).to.contain(
        "{{" + jsObjName + ".myVar2}}",
      );
    });
    cy.get(this._bindingsClose).click({ force: true });
  }

  // public EnableDisableOnPageLoad(funName: string, onLoad: 'enable' | 'disable' | '', bfrCalling: 'enable' | 'disable' | '') {
  //   this.agHelper.GetNClick(this._responseTabAction(funName))
  //   this.agHelper.AssertElementPresence(this._dialog('Function settings'))
  //   if (onLoad)
  //     this.agHelper.CheckUncheck(this._functionSetting(Cypress.env("MESSAGES").JS_SETTINGS_ONPAGELOAD()), onLoad == 'enable' ? true : false)
  //   if (bfrCalling)
  //     this.agHelper.CheckUncheck(this._functionSetting(Cypress.env("MESSAGES").JS_SETTINGS_CONFIRM_EXECUTION()), bfrCalling == 'enable' ? true : false)

  //   this.agHelper.GetNClick(this._closeSettings)
  // }

  public VerifyAsyncFuncSettings(
    funName: string,
    onLoad = true,
    bfrCalling = true,
  ) {
    // this.agHelper.GetNClick(this._responseTabAction(funName))
    // this.agHelper.AssertElementPresence(this._dialog('Function settings'))
    // this.agHelper.AssertExistingToggleState(this._functionSetting(Cypress.env("MESSAGES").JS_SETTINGS_ONPAGELOAD()), onLoad)
    // this.agHelper.AssertExistingToggleState(this._functionSetting(Cypress.env("MESSAGES").JS_SETTINGS_CONFIRM_EXECUTION()), bfrCalling)
    // this.agHelper.GetNClick(this._closeSettings)

    this.agHelper.GetNClick(this._settingsTab);
    this.agHelper.AssertExistingToggleState(
      this._onPageLoadRadioButtonStatus(funName, onLoad),
      "checked",
    );
    this.agHelper.AssertExistingToggleState(
      this._confirmBeforeExecuteRadioButtonStatus(funName, bfrCalling),
      "checked",
    );
  }

  public EnableDisableAsyncFuncSettings(
    funName: string,
    onLoad = true,
    bfrCalling = true,
  ) {
    // Navigate to Settings tab
    this.agHelper.GetNClick(this._settingsTab);
    // Set onPageLoad
    this.agHelper.GetNClick(this._onPageLoadRadioButton(funName, onLoad));
    // Set confirmBeforeExecute
    this.agHelper.GetNClick(
      this._confirmBeforeExecuteRadioButton(funName, bfrCalling),
    );
    // Return to code tab
    this.agHelper.GetNClick(this._codeTab);
  }
  /**
 * 
  There are two types of parse errors in the JS Editor
  1. Parse errors that render the JS Object invalid and all functions unrunnable
  2. Parse errors within functions that throw errors when executing those functions
 */
  public AssertParseError(
    exists: boolean,
    isFunctionExecutionParseError: boolean,
  ) {
    // Assert presence/absence of parse error
    cy.xpath(
      isFunctionExecutionParseError
        ? this._jsFunctionExecutionParseErrorCallout
        : this._jsObjectParseErrorCallout,
    ).should(exists ? "exist" : "not.exist");
  }

  //#endregion
}
