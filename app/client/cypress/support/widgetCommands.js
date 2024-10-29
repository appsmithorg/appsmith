/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

import PageList from "./Pages/PageList";

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
const commonlocators = require("../locators/commonlocators.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");
const LayoutPage = require("../locators/Layout.json");
const formWidgetsPage = require("../locators/FormWidgets.json");
const apiwidget = require("../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../locators/DynamicInput.json");
const viewWidgetsPage = require("../locators/ViewWidgets.json");
import { ObjectsRegistry } from "../support/Objects/Registry";
import { TABLE_COLUMN_ORDER_KEY } from "./Constants";
import { EntityItems } from "./Pages/AssertHelper";

let pageidcopy = " ";

const ee = ObjectsRegistry.EntityExplorer;
const agHelper = ObjectsRegistry.AggregateHelper;
const propPane = ObjectsRegistry.PropertyPane;

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("changeZoomLevel", (zoomValue) => {
  cy.get(commonlocators.changeZoomlevel).last().click();
  cy.get(".t--dropdown-option").children().contains(zoomValue).click();
  cy.wait("@updateLayout").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
  cy.get(commonlocators.selectedZoomlevel)
    .last()
    .invoke("text")
    .then((text) => {
      const someText = text;
      expect(someText).to.equal(zoomValue);
    });
});

Cypress.Commands.add(
  "changeColumnType",
  (dataType, doesPropertyTabExist = true) => {
    if (doesPropertyTabExist) cy.moveToContentTab();
    cy.get(commonlocators.changeColType).last().click();
    cy.get(".t--dropdown-option").children().contains(dataType).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
      cy.get(commonlocators.selectedColType)
        .first()
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(dataType);
        });
        */
  },
);

Cypress.Commands.add("switchToPaginationTab", () => {
  cy.get(apiwidget.paginationTab).first().click({ force: true });
});

Cypress.Commands.add("selectDateFormat", (value) => {
  cy.get(
    ".t--property-control-dateformat .ads-v2-select > .rc-select-selector",
  ).click({
    force: true,
  });
  cy.get(".t--dropdown-option")
    .children()
    .contains(value)
    .click({ force: true });
});

Cypress.Commands.add("selectDropdownValue", (element, value) => {
  cy.get(element).last().scrollIntoView().click({ force: true });
  cy.get(".t--dropdown-option")
    .children()
    .contains(value)
    .click({ force: true });
});

Cypress.Commands.add("assertDateFormat", () => {
  cy.get(".t--draggable-datepickerwidget2 input")
    .first()
    .invoke("attr", "value")
    .then((text) => {
      const firstTxt = text;
      cy.log("date time : ", firstTxt);
      cy.get(commonlocators.labelTextStyle).first().should("contain", firstTxt);
      cy.get(commonlocators.labelTextStyle)
        .last()
        .invoke("text")
        .then((text) => {
          const secondText = text;
          cy.log("date time : ", secondText);
          expect(firstTxt).not.to.equal(secondText);
        });
    });
});

Cypress.Commands.add("selectPaginationType", (option) => {
  cy.xpath(option).click({ force: true });
});

Cypress.Commands.add("copyJSObjectToPage", (pageName) => {
  cy.xpath(apiwidget.popover).last().click({ force: true });
  cy.get(apiwidget.copyTo).click({ force: true });
  cy.get(apiwidget.page).contains(pageName).click();
  cy.wait("@createNewJSCollection").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("AddActionWithModal", () => {
  propPane.SelectPlatformFunction("onTabSelected", "Show modal");
  agHelper.GetNClick(propPane._actionOpenDropdownSelectModal, 0, true);
  cy.get(".t--create-modal-btn").click({ force: true });
});

Cypress.Commands.add("createModal", (ModalName, property) => {
  ObjectsRegistry.PropertyPane.AddAction(property);
  cy.get(ObjectsRegistry.CommonLocators._dropDownValue("Show modal")).click();
  cy.get(modalWidgetPage.selectModal).click();
  cy.wait(2000);
  cy.get(modalWidgetPage.createModalButton).click({ force: true });
  cy.wait(3000);
  agHelper.AssertAutoSave();
  // changing the model name verify
  // cy.widgetText(
  //   ModalName,
  //   modalWidgetPage.modalName,
  //   modalWidgetPage.modalName,
  // );

  //changing the Model label
  // cy.get(modalWidgetPage.modalWidget + " " + widgetsPage.textWidget)
  //   .first()
  //   .trigger("mouseover");
  cy.get(widgetsPage.modalWidget)
    .find(widgetsPage.textWidget)
    .first()
    .click({ force: true });

  //cy.get(".t--modal-widget" +" "+ widgetsPage.textWidget).click();
  cy.testCodeMirror(ModalName);
  cy.moveToStyleTab();
  cy.xpath(widgetsPage.textCenterAlign).first().click({ force: true });
  agHelper.AssertAutoSave();
  cy.get(".bp3-overlay-backdrop").last().click({ force: true });
});

Cypress.Commands.add("selectOnClickOption", (option) => {
  cy.get(".bp3-popover-content").should("be.visible");
  cy.get("ul.bp3-menu div.bp3-fill")
    .should("be.visible")
    .contains(option)
    .click({ force: true });
});

Cypress.Commands.add("selectWidgetOnClickOption", (option) => {
  cy.get(".bp3-popover-content").should("be.visible");
  cy.get(commonlocators.selectWidgetVirtualList)
    .should("be.visible")
    .contains(option)
    .click({ force: true });
});

Cypress.Commands.add("CheckWidgetProperties", (checkboxCss) => {
  cy.get(checkboxCss).check({
    force: true,
  });
  agHelper.AssertAutoSave();
});

Cypress.Commands.add("UncheckWidgetProperties", (checkboxCss) => {
  cy.get(checkboxCss).uncheck({
    force: true,
  });
  agHelper.AssertAutoSave();
});

Cypress.Commands.add("EditWidgetPropertiesUsingJS", (checkboxCss, inputJS) => {
  cy.get(checkboxCss, { timeout: 10000 })
    .last()
    .should("exist")
    .dblclick({ force: true })
    .type(inputJS);
  agHelper.AssertAutoSave();
});

Cypress.Commands.add(
  "ChangeTextStyle",
  (dropDownValue, textStylecss, labelName) => {
    cy.get(commonlocators.dropDownIcon).last().click();
    cy.get(".t--dropdown-option").children().contains(dropDownValue).click();
    cy.get(textStylecss).should("have.text", labelName);
  },
);

Cypress.Commands.add("widgetText", (text, inputcss, innercss) => {
  cy.get(commonlocators.propertyPaneTitle)
    .click({ force: true })
    .type(text, { delay: 300 })
    .type("{enter}");
  cy.get(inputcss).first().click({ force: true });
  cy.contains(innercss, text);
});

Cypress.Commands.add("verifyUpdatedWidgetName", (text, txtToVerify) => {
  cy.get(commonlocators.propertyPaneTitle)
    .click({ force: true })
    .type(text)
    .type("{enter}");
  agHelper.AssertAutoSave();
  if (!txtToVerify) cy.get(".editable-text-container").contains(text);
  else cy.get(".editable-text-container").contains(txtToVerify);
  cy.wait(2000); //for widget name to reflect!
});

Cypress.Commands.add("verifyWidgetText", (text, inputcss, innercss) => {
  cy.get(inputcss).first().trigger("mouseover", { force: true });
  cy.contains(innercss, text);
});

Cypress.Commands.add("editColName", (text) => {
  cy.get(commonlocators.editColTitle)
    .click({ force: true })
    .type(text)
    .type("{enter}");
  cy.get(commonlocators.editColText).should("have.text", text);
});

Cypress.Commands.add("invalidWidgetText", () => {
  // checking invalid widget name
  cy.get(commonlocators.propertyPaneTitle)
    .click({ force: true })
    .type("download")
    .type("{enter}");
  cy.get(commonlocators.toastmsg).contains("download is already being used.");
});

Cypress.Commands.add("EvaluateDataType", (dataType) => {
  cy.get(commonlocators.evaluatedType)
    .first()
    .should("be.visible")
    .contains(dataType);
});

Cypress.Commands.add("getCodeMirror", () => {
  cy.EnableAllCodeEditors();
  return cy
    .get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}");
});

Cypress.Commands.add("testCodeMirror", (value) => {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  cy.EnableAllCodeEditors();
  cy.wait(2000);
  cy.get(".CodeMirror textarea")
    .first()
    .focus()
    .type(`{${modifierKey}}a`)
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea").first().clear({
          force: true,
        });
      }

      cy.get(".CodeMirror textarea").first().type(value, {
        force: true,
        parseSpecialCharSequences: false,
      });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(".CodeMirror textarea").first().should("have.value", value);
    });
});

Cypress.Commands.add("updateComputedValue", (value) => {
  cy.EnableAllCodeEditors();
  cy.get(".CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea").first().clear({
        force: true,
      });
    }
    cy.get(".CodeMirror textarea").first().type(value, {
      force: true,
      parseSpecialCharSequences: false,
    });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("clearComputedValueFirst", () => {
  cy.get(".CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(() => {
    cy.get(".CodeMirror textarea").first().clear({
      force: true,
    });
    cy.log("The field is empty");
  });
  cy.wait(1000);
});

Cypress.Commands.add("updateComputedValueV2", (value) => {
  cy.get(".t--property-control-computedvalue .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea").first().clear({
        force: true,
      });
    }
    cy.get(".t--property-control-computedvalue .CodeMirror textarea")
      .first()
      .type(value, {
        force: true,
        parseSpecialCharSequences: false,
      });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("testCodeMirrorWithIndex", (value, index) => {
  cy.EnableAllCodeEditors();
  cy.get(".CodeMirror textarea")
    .eq(index)
    .focus()
    .type("{ctrl}{shift}{downarrow}", { force: true })
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea").eq(index).clear({
          force: true,
        });
      }

      cy.get(".CodeMirror textarea")
        .eq(index)
        .type("{ctrl}{shift}{downarrow}", { force: true })
        .clear({ force: true })
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
      cy.get(".CodeMirror textarea").eq(index).should("have.value", value);
    });
});

Cypress.Commands.add("testCodeMirrorLast", (value) => {
  cy.EnableAllCodeEditors();
  cy.get(".CodeMirror textarea")
    .last()
    .focus()
    .type("{ctrl}{shift}{downarrow}", { force: true })
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea").last().clear({
          force: true,
        });
      }

      cy.get(".CodeMirror textarea")
        .last()
        .type("{ctrl}{shift}{downarrow}", { force: true })
        .clear({ force: true })
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
      cy.get(".CodeMirror textarea").last().should("have.value", value);
    });
});

Cypress.Commands.add("testJsontext", (endp, value, paste = true) => {
  cy.EnableAllCodeEditors();
  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{ctrl}{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is not empty");
      cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
        .first()
        .click({ force: true })
        .focused({ force: true })
        .clear({
          force: true,
        });
    }
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
      .first()
      .then((el) => {
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
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2500); //Allowing time for Evaluate value to capture value
});

Cypress.Commands.add("testJsontextclear", (endp) => {
  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{ctrl}{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is not empty");
      cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
        .first()
        .click({ force: true })
        .focused({ force: true })
        .clear({
          force: true,
        });
    }
  });
});

Cypress.Commands.add("testJsonTextClearMultiline", (endp) => {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type(`{${modifierKey}}{a}`, { force: true })
    .type(`{${modifierKey}}{del}`, { force: true });
});

Cypress.Commands.add("getCodeInput", ($selector, value) => {
  cy.EnableAllCodeEditors();
  cy.get($selector)
    .first()
    .click({ force: true })
    .find(".CodeMirror")
    .first()
    .then((ins) => {
      const input = ins[0];
      return cy.wrap(input);
    });
});

/**
 * Usage:
 * Find the element which has a code editor input and then pass it in the function
 *
 * cy.get(...).then(el => cy.updateCodeInput(el, "test"));
 *
 */
Cypress.Commands.add("updateCodeInput", ($selector, value) => {
  cy.getCodeInput($selector).then((input) => {
    const codeMirrorInput = input[0].CodeMirror;
    codeMirrorInput.focus();
    cy.wait(200);
    codeMirrorInput.setValue(value);
    cy.wait(500); //time for value to set
  });
});

Cypress.Commands.add(
  "focusCodeInput",
  ($selector, cursor = { ch: 0, line: 0 }) => {
    cy.getCodeInput($selector).then((input) => {
      const codeMirrorInput = input[0].CodeMirror;
      codeMirrorInput.focus();
      cy.wait(200);
      codeMirrorInput.setCursor(cursor);
      cy.wait(1000); //time for value to set
    });
  },
);

Cypress.Commands.add(
  "assertCursorOnCodeInput",
  ($selector, cursor = { ch: 0, line: 0 }) => {
    cy.EnableAllCodeEditors();
    cy.get($selector)
      .first()
      .find(".CodeMirror")
      .first()
      .then((ins) => {
        const input = ins[0].CodeMirror;
        // The input gets focused with a slight delay so we need to wait for it
        cy.waitUntil(() => input.hasFocus()).then(() => {
          const editorCursor = input.getCursor();
          expect(editorCursor.ch).to.equal(cursor.ch);
          expect(editorCursor.line).to.equal(cursor.line);
        });
      });
  },
);

Cypress.Commands.add(
  "assertSoftFocusOnCodeInput",
  ($selector, cursor = { ch: 0, line: 0 }) => {
    cy.EnableAllCodeEditors();
    cy.get($selector)
      .find(".CodeEditorTarget")
      .should("have.focus")
      .find(".CodeMirror")
      .first()
      .then((ins) => {
        const input = ins[0].CodeMirror;
        if (!input.hasFocus()) {
          input.focus();
        }
        expect(input.hasFocus()).to.be.true;
        const editorCursor = input.getCursor();
        expect(editorCursor.ch).to.equal(cursor.ch);
        expect(editorCursor.line).to.equal(cursor.line);
      });
  },
);

Cypress.Commands.add("selectColor", (GivenProperty, colorOffset = -15) => {
  // Property pane of the widget is opened, and click given property.
  cy.get(
    ".t--property-control-" + GivenProperty + " .bp3-input-group input",
  ).click({
    force: true,
  });

  cy.get(widgetsPage.colorPickerV2Color)
    .eq(colorOffset)
    .then(($elem) => {
      cy.get($elem).click({ force: true });
    });
});

Cypress.Commands.add("toggleJsAndUpdate", (endp, value) => {
  cy.EnableAllCodeEditors();
  cy.get(".CodeMirror textarea")
    .last()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea").last().clear({
        force: true,
      });
    }
    cy.get(".CodeMirror textarea").last().type(value, {
      force: true,
      parseSpecialCharSequences: false,
    });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(200);
});

Cypress.Commands.add("toggleJsAndUpdateWithIndex", (endp, value, index) => {
  cy.get(".CodeMirror textarea")
    .eq(index)
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea").eq(index).clear({
        force: true,
      });
    }
    cy.get(".CodeMirror textarea").eq(index).type(value, {
      force: true,
      parseSpecialCharSequences: false,
    });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(200);
});

Cypress.Commands.add("assertControlVisibility", (endp) => {
  cy.get(".t--property-control-" + endp + " .CodeMirror")
    .first()
    .should("not.be.visible");
});

Cypress.Commands.add("tableColumnDataValidation", (columnName) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + columnName + "'] input")
    .scrollIntoView()
    .first()
    .focus({ force: true })
    .should("be.visible");
});

Cypress.Commands.add("tableV2ColumnDataValidation", (columnName) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + columnName + "'] input[type='text']")
    .scrollIntoView()
    .first()
    .focus({ force: true })
    .should("be.visible");
});

Cypress.Commands.add("tableColumnPopertyUpdate", (colId, newColName) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + colId + "'] input")
    .scrollIntoView()
    .should("be.visible")
    .click({
      force: true,
    });
  cy.get("[data-rbd-draggable-id='" + colId + "'] input").clear({
    force: true,
  });
  cy.get("[data-rbd-draggable-id='" + colId + "'] input").type(newColName, {
    force: true,
  });
  cy.get(".draggable-header ").contains(newColName).should("be.visible");
});

Cypress.Commands.add("tableV2ColumnPopertyUpdate", (colId, newColName) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + colId + "'] input[type='text']")
    .scrollIntoView()
    .should("be.visible")
    .click({
      force: true,
    });
  cy.get("[data-rbd-draggable-id='" + colId + "'] input[type='text']").clear({
    force: true,
  });
  cy.get("[data-rbd-draggable-id='" + colId + "'] input[type='text']").type(
    newColName,
    {
      force: true,
    },
  );
  cy.get(".draggable-header ").contains(newColName).should("be.visible");
});

Cypress.Commands.add("backFromPropertyPanel", () => {
  cy.wait(500);
  cy.get("body").then(($body) => {
    let count = $body.find(commonlocators.editPropBackButton)?.length || 0;
    if (count > 0) {
      cy.get(commonlocators.editPropBackButton).click({ force: true });
      cy.wait(500);
      cy.backFromPropertyPanel();
    }
  });
});

Cypress.Commands.add("hideColumn", (colId) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("showColumn", (colId) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  cy.get(".draggable-header ").contains(colId).should("be.visible");
});
Cypress.Commands.add("deleteColumn", (colId) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--delete-column-btn").click(
    {
      force: true,
    },
  );
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add(
  "openFieldConfiguration",
  (fieldIdentifier, shouldClosePanel = true) => {
    if (shouldClosePanel) {
      cy.backFromPropertyPanel();
    }
    cy.get(
      "[data-rbd-draggable-id='" + fieldIdentifier + "'] .t--edit-column-btn",
    ).click({
      force: true,
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
  },
);

Cypress.Commands.add("deleteJSONFormField", (fieldIdentifier) => {
  cy.backFromPropertyPanel();
  cy.get(
    "[data-rbd-draggable-id='" + fieldIdentifier + "'] .t--delete-column-btn",
  ).click({
    force: true,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("makeColumnVisible", (colId) => {
  cy.backFromPropertyPanel();
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  cy.wait(1000);
});

Cypress.Commands.add("addColumn", (colId) => {
  cy.get(widgetsPage.addColumn).scrollIntoView();
  cy.get(widgetsPage.addColumn).should("be.visible").click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
  cy.get(widgetsPage.defaultColName).clear({
    force: true,
  });
  cy.get(widgetsPage.defaultColName).type(colId, { force: true });
});

Cypress.Commands.add("addColumnV2", (colId) => {
  cy.get(widgetsPage.addColumn).scrollIntoView();
  cy.get(widgetsPage.addColumn).should("be.visible").click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
  cy.get(widgetsPage.defaultColNameV2).clear({
    force: true,
  });
  cy.get(widgetsPage.defaultColNameV2).type(colId, { force: true });
});

Cypress.Commands.add("editColumn", (colId, shouldReturnToMainPane = true) => {
  if (shouldReturnToMainPane) {
    cy.backFromPropertyPanel();
  }
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--edit-column-btn").click({
    force: true,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1500);
});

Cypress.Commands.add("readTextDataValidateCSS", (cssProperty, cssValue) => {
  cy.get(commonlocators.headingTextStyle).should(
    "have.css",
    cssProperty,
    cssValue,
  );
});

Cypress.Commands.add("evaluateErrorMessage", (value) => {
  cy.get(commonlocators.evaluateMsg)
    .first()
    .click()
    .invoke("text")
    .then((text) => {
      const someText = text;
      expect(someText).to.equal(value);
    });
});

Cypress.Commands.add("addAction", (value, property) => {
  cy.get(`.t--add-action-${property}`).click();
  cy.get(`.single-select:contains('Show alert')`).click();

  cy.enterActionValue(value, property);
});

// Cypress.Commands.add("addSuccessMessage", (value) => {
//   cy.get(commonlocators.chooseMsgType).last().click({ force: true });
//   cy.get(commonlocators.chooseAction).children().contains("Success").click();
//   cy.enterActionValue(value);
// });

Cypress.Commands.add("selectResetWidget", (eventName) => {
  cy.get(`.t--add-action-${eventName}`).scrollIntoView().click({ force: true });
  cy.get('.single-select:contains("Reset widget")').click({ force: true });
});

Cypress.Commands.add("selectWidgetForReset", (value) => {
  cy.get(widgetsPage.selectWidget).click({ force: true });
  cy.get(`.single-select:contains(${value})`).click();
});

Cypress.Commands.add("SetDateToToday", () => {
  cy.get(".DayPicker-Day--today").click({
    force: true,
  });
  agHelper.AssertAutoSave();
});

Cypress.Commands.add("enterActionValue", (value, property) => {
  cy.EnableAllCodeEditors();
  let codeMirrorTextArea = ".CodeMirror textarea";
  if (property) codeMirrorTextArea = `${codeMirrorTextArea}`;
  cy.get(codeMirrorTextArea)
    .last()
    .focus()
    .type("{ctrl}{shift}{downarrow}", { force: true })
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(codeMirrorTextArea).last().clear({
          force: true,
        });
      }

      cy.get(codeMirrorTextArea).last().type(value, {
        force: true,
        parseSpecialCharSequences: false,
      });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
    });
});

Cypress.Commands.add("enterEventValue", (value) => {
  cy.get(commonlocators.optionchangetextDropdown)
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(commonlocators.optionchangetextDropdown).clear({
          force: true,
        });
      }

      cy.get(commonlocators.optionchangetextDropdown).type(value, {
        force: true,
        parseSpecialCharSequences: false,
      });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
    });
});

Cypress.Commands.add("enterNavigatePageName", (value) => {
  cy.get("ul.tree")
    .children()
    .first()
    .within(() => {
      cy.get(".CodeMirror textarea")
        .first()
        .focus()
        .type("{ctrl}{shift}{downarrow}")
        .then(($cm) => {
          if ($cm.val() !== "") {
            cy.get(".CodeMirror textarea").first().clear({
              force: true,
            });
          }
          cy.get(".CodeMirror textarea").first().type(value, {
            force: true,
            parseSpecialCharSequences: false,
          });
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(200);
          cy.get(".CodeMirror textarea").first().should("have.value", value);
        });
      cy.root();
    });
});

Cypress.Commands.add("ClearDate", () => {
  cy.get(".t--property-control-defaultdate input").clear();
  agHelper.AssertAutoSave();
});

Cypress.Commands.add("ClearDateFooter", () => {
  cy.get(formWidgetsPage.datepickerFooterPublish)
    .contains("Clear")
    .click({ force: true });
  //cy.assertPageSave();
});

Cypress.Commands.add("DeleteModal", () => {
  cy.get(widgetsPage.textbuttonWidget).dblclick("topRight", { force: true });
  cy.get(widgetsPage.deleteWidget).first().click({ force: true });
});

Cypress.Commands.add("Createpage", (pageName, navigateToCanvasPage = true) => {
  PageList.AddNewPage().then((oldPageName) => {
    if (pageName) {
      cy.wait(2000);
      ee.RenameEntityFromExplorer(
        oldPageName,
        pageName,
        false,
        EntityItems.Page,
      );
    }
    cy.get("#loading").should("not.exist");
  });
  cy.get("@createPage").then((xhr) => {
    const pageId = xhr.response.body.data.id;
    cy.wrap(pageId).as("currentPageId");
  });
});

Cypress.Commands.add("dropdownDynamic", (text) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get("ul.bp3-menu")
    .contains(text)
    .click({ force: true })
    .should("have.text", text);
});

Cypress.Commands.add("dropdownMultiSelectDynamic", (text) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(".multi-select-dropdown")
    .contains(text)
    .click({ force: true })
    .should("have.text", text);
});

Cypress.Commands.add("treeSelectDropdown", (text) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(".tree-select-dropdown")
    .contains(text)
    .click({ force: true })
    .should("have.text", text);
});

Cypress.Commands.add("treeMultiSelectDropdown", (text) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(".tree-multiselect-dropdown")
    .contains(text)
    .click({ force: true })
    .should("have.text", text);
});

Cypress.Commands.add("dropdownDynamicUpdated", (text) => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.get(commonlocators.dropdownmenu).contains(text).click({ force: true });
  cy.xpath(commonlocators.dropDownOptSelected).should("have.text", text);
});

Cypress.Commands.add("selectTextSize", (text) => {
  cy.get(".t--dropdown-option").first().contains(text).click({ force: true });
});

Cypress.Commands.add("selectTxtSize", (text) => {
  cy.get(".t--dropdown-option").contains(text).click({ force: true });
});

Cypress.Commands.add("getAlert", (eventName, value = "hello") => {
  cy.get(`.t--add-action-${eventName}`).scrollIntoView().click({ force: true });
  cy.get('.single-select:contains("Show alert")')
    .click({ force: true })
    .wait(500);
  agHelper.EnterActionValue("Message", value);
  cy.get(".t--open-dropdown-Select-type").click({ force: true });
  cy.get(".bp3-popover-content .bp3-menu li")
    .contains("Success")
    .click({ force: true });
  ObjectsRegistry.AggregateHelper.GetNClick(
    ObjectsRegistry.PropertyPane._actionSelectorPopupClose,
    0,
    true,
  );
});

Cypress.Commands.add("addQueryFromLightningMenu", (QueryName) => {
  cy.get(commonlocators.dropdownSelectButton)
    .first()
    .click({ force: true })
    .selectOnClickOption("Execute a query")
    .selectOnClickOption(QueryName);
});

Cypress.Commands.add(
  "addAPIFromLightningMenu",
  (ApiName, eventName = "onClick") => {
    ObjectsRegistry.PropertyPane.AddAction(eventName);
    cy.get(ObjectsRegistry.CommonLocators._dropDownValue("Execute a query"))
      .click()
      .selectOnClickOption(ApiName);
  },
);

Cypress.Commands.add("radioInput", (index, text) => {
  cy.get(widgetsPage.RadioInput)
    .eq(index)
    .focus()
    .clear({ force: true })
    .type(text)
    .wait(200);
});
Cypress.Commands.add("tabVerify", (index, text) => {
  cy.get(".t--property-control-tabs input")
    .eq(index)
    .click({ force: true })
    .clear()
    .type(text);
  cy.get(LayoutPage.tabWidget)
    .contains(text)
    .click({ force: true })
    .should("be.visible");
});

Cypress.Commands.add("openPropertyPane", (widgetType) => {
  const selector = `.t--draggable-${widgetType}`;
  cy.wait(500);
  cy.get(selector).first().trigger("mouseover", { force: true }).wait(500);
  cy.get(`${selector}:first-of-type`).first().click({ force: true }).wait(500);
  cy.get(".t--widget-propertypane-toggle > .t--widget-name")
    .first()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("openPropertyPaneFromModal", (widgetType) => {
  const selector = `.t--draggable-${widgetType}`;
  cy.wait(500);
  cy.get(selector).first().trigger("mouseover", { force: true }).wait(500);
  cy.get(`${selector}:first-of-type`).first().click({ force: true }).wait(500);
  cy.get(".t--widget-propertypane-toggle > .t--widget-name")
    .last()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add(
  "openPropertyPaneByWidgetName",
  (widgetName, widgetType) => {
    const selector = `[data-widgetname-cy="${widgetName}"] .t--draggable-${widgetType}`;
    cy.wait(500);
    cy.get(selector)
      .first()
      .trigger("mouseover", { force: true })
      .click({ force: true })
      .wait(500);
    cy.get(".t--widget-propertypane-toggle > .t--widget-name")
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
  },
);

Cypress.Commands.add("openPropertyPaneCopy", (widgetType) => {
  const selector = `.t--draggable-${widgetType}`;
  cy.get(selector).last().trigger("mouseover", { force: true }).wait(500);
  cy.get(`${selector}:first-of-type`).first().click({ force: true }).wait(500);
  cy.get(".t--widget-propertypane-toggle > .t--widget-name")
    .first()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("copyWidget", (widget, widgetLocator) => {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  //Copy widget and verify all properties
  cy.get(widgetsPage.propertypaneText)
    .children()
    .last()
    .invoke("text")
    .then((x) => {
      //cy.log(x);
      let originalWidget = x
        .replaceAll("x", "")
        .replaceAll(/\u200B/g, "")
        .replaceAll("\n", "")
        .replaceAll("/Type / to access quick commands", "");
      cy.log(originalWidget);
      cy.get(widgetsPage.copyWidget).click({ force: true });
      cy.wait(3000);
      cy.reload();
      // Wait for the widget to be appear in the DOM and press Ctrl/Cmd + V to paste the button.
      cy.get(widgetLocator).should("be.visible");
      cy.wait(1000);
      cy.get("body").type(`{${modifierKey}}v`);
      cy.wait(3000);
      cy.openPropertyPaneCopy(widget);
      cy.get(widgetsPage.propertypaneText)
        .children()
        .last()
        .invoke("text")
        .then((y) => {
          //cy.log(y);
          let copiedWidget = y
            .replaceAll("x", "")
            .replaceAll(/\u200B/g, "")
            .replaceAll("\n", "")
            .replaceAll("/Type / to access quick commands", "");
          cy.log(copiedWidget);
          expect(originalWidget).to.equal(copiedWidget);
        });
    });
});

Cypress.Commands.add("deleteWidget", () => {
  // Delete the button widget
  cy.get(widgetsPage.removeWidget).click({ force: true });
  cy.wait(3000);
  cy.wait("@updateLayout");
});

Cypress.Commands.add("UpdateChartType", (typeOfChart) => {
  cy.selectDropdownValue(viewWidgetsPage.chartType, typeOfChart);
  cy.get(
    `${viewWidgetsPage.chartTypeText} .rc-select-selection-item span`,
  ).should("have.text", typeOfChart);
});

Cypress.Commands.add("alertValidate", (text) => {
  cy.get(commonlocators.success).should("be.visible").and("have.text", text);
});

Cypress.Commands.add("ExportVerify", (togglecss, name) => {
  cy.togglebar(togglecss);
  cy.get(".t--draggable-tablewidget button")
    .invoke("attr", "aria-label")
    .should("contain", name);
  agHelper.CheckUncheck(togglecss, false);
});

Cypress.Commands.add("getTableDataSelector", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div div`;
  return selector;
});

Cypress.Commands.add("getTableV2DataSelector", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidgetv2 .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}]`;
  return selector;
});

Cypress.Commands.add("readTabledata", (rowNum, colNum) => {
  // const selector = `.t--draggable-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
  const selector = `.tbody .td[data-rowindex="${rowNum}"][data-colindex="${colNum}"] div div`;
  const tabVal = cy.get(selector).invoke("text");
  return tabVal;
});

Cypress.Commands.add("readTableV2data", (rowNum, colNum) => {
  // const selector = `.t--draggable-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
  const selector = `.tbody .td[data-rowindex="${rowNum}"][data-colindex="${colNum}"]`;
  const tabVal = cy.get(selector).invoke("text");
  return tabVal;
});

Cypress.Commands.add(
  "readTabledataPublish",
  (rowNum, colNum, shouldNotGoOneLeveDeeper) => {
    // const selector = `.t--widget-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
    const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div ${
      !shouldNotGoOneLeveDeeper ? "div" : ""
    }`;
    const tabVal = cy.get(selector).invoke("text");
    return tabVal;
  },
);

Cypress.Commands.add("readTableV2dataPublish", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidgetv2 .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}]`;
  const tabVal = cy.get(selector).invoke("text");
  return tabVal;
});

Cypress.Commands.add(
  "readTabledataValidateCSS",
  (rowNum, colNum, cssProperty, cssValue, shouldNotGotOneLeveDeeper) => {
    const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div ${
      !shouldNotGotOneLeveDeeper ? "div" : ""
    }`;
    cy.get(selector).should("have.css", cssProperty, cssValue);
  },
);

Cypress.Commands.add(
  "readTableV2dataValidateCSS",
  (rowNum, colNum, cssProperty, cssValue) => {
    const selector = `.t--widget-tablewidgetv2 .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] .cell-wrapper`;
    cy.get(selector).should("have.css", cssProperty, cssValue);
  },
);

Cypress.Commands.add(
  "readTabledataFromSpecificIndex",
  (rowNum, colNum, index) => {
    // const selector = `.t--widget-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
    const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div`;
    const tabVal = cy.get(selector).eq(index).invoke("text");
    return tabVal;
  },
);

Cypress.Commands.add(
  "readTableV2dataFromSpecificIndex",
  (rowNum, colNum, index) => {
    const selector = `.t--widget-tablewidgetv2 .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}]`;
    const tabVal = cy.get(selector).eq(index).invoke("text");
    return tabVal;
  },
);

Cypress.Commands.add("tablefirstdataRow", () => {
  let tabVal = cy
    .xpath(
      "//div[@class='tableWrap']//div[@class='table']//div[contains(@class, 'tbody')]/div[@class='tr']/div[@class ='td']",
      { timeout: 10000 },
    )
    .first()
    .invoke("text");
  return tabVal;
});

Cypress.Commands.add("scrollTabledataPublish", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div div`;
  const tabVal = cy.get(selector).scrollIntoView().invoke("text");
  return tabVal;
});

Cypress.Commands.add("readTableLinkPublish", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div .image-cell-wrapper .image-cell`;
  const bgUrl = cy.get(selector).should("have.css", "background-image");
  return bgUrl;
});

Cypress.Commands.add("readTableV2LinkPublish", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidgetv2 .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div .image-cell-wrapper .image-cell`;
  const bgUrl = cy.get(selector).should("have.attr", "src");
  return bgUrl;
});

Cypress.Commands.add("assertEvaluatedValuePopup", (expectedType) => {
  cy.get(commonlocators.evaluatedTypeTitle).first().find("span").click();
  cy.get(dynamicInputLocators.evaluatedValue)
    .should("be.visible")
    .find("pre")
    .first()
    .should("have.text", expectedType);
});

Cypress.Commands.add("validateToastMessage", (value) => {
  cy.get(commonlocators.toastMsg).should("contain.text", value);
});

Cypress.Commands.add(
  "validateWidgetExists",
  { prevSubject: true },
  (selector) => {
    cy.get(selector).should("exist");
  },
);

Cypress.Commands.add("clearPropertyValue", (value) => {
  cy.EnableAllCodeEditors();
  cy.get(".CodeMirror textarea")
    .eq(value)
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea").eq(value).clear({
        force: true,
      });
    }
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});
Cypress.Commands.add(
  "validateNSelectDropdown",
  (ddTitle, currentValue, newValue) => {
    let toChange = false;
    cy.xpath('//span[contains(text(),"' + currentValue + '")]').should(
      "exist",
      currentValue + " dropdown value not present",
    );
    if (newValue) toChange = true;
    if (toChange) {
      cy.xpath(
        "//p[text()='" +
          ddTitle +
          "']/parent::label/following-sibling::div/div/div",
      ).click(); //to expand the dropdown
      cy.xpath('//span[contains(text(),"' + newValue + '")]')
        .last()
        .click({ force: true }); //to select the new value
    }
  },
);

Cypress.Commands.add("EnableAllCodeEditors", () => {
  cy.get(commonlocators.lazyCodeEditorFallback, { timeout: 60000 }).should(
    "not.exist",
  );
  // Code editors might not always be present on the page, so we need to check for their existence first
  // (https://docs.cypress.io/guides/core-concepts/conditional-testing#Element-existence)
  cy.get("body").then(($body) => {
    if ($body.find(commonlocators.lazyCodeEditorRendered).length === 0) return;

    return cy.get(commonlocators.lazyCodeEditorRendered).each(($el) => {
      cy.wrap($el).find(".CodeMirror").should("exist");
    });
  });
});

Cypress.Commands.add("getTableCellHeight", (x, y) => {
  return cy
    .get(
      `.t--widget-tablewidgetv2 .tbody .td[data-colindex=${x}][data-rowindex=${y}] .cell-wrapper div`,
    )
    .invoke("css", "height");
});

Cypress.Commands.add("hoverTableCell", (x, y) => {
  return cy.get(`[data-colindex="${x}"][data-rowindex="${y}"]`).then((ele) => {
    const { left, top } = ele[0].getBoundingClientRect();
    cy.get(
      `[data-colindex=${x}][data-rowindex=${y}] .t--table-text-cell`,
    ).trigger("mousemove", top + 5, left + 5, {
      eventConstructor: "MouseEvent",
      force: true,
    });
  });
});

Cypress.Commands.add("editTableCell", (x, y) => {
  cy.get(`[data-colindex="${x}"][data-rowindex="${y}"] .t--editable-cell-icon`)
    .invoke("show")
    .click({ force: true });
  cy.wait(500);
  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] .t--inlined-cell-editor input.bp3-input`,
  ).should("exist");
});

Cypress.Commands.add("editTableSelectCell", (x, y) => {
  cy.get(`[data-colindex="${x}"][data-rowindex="${y}"] .t--editable-cell-icon`)
    .invoke("show")
    .click({ force: true });
  cy.get(`[data-colindex="${x}"][data-rowindex="${y}"] .select-button`).should(
    "exist",
  );
});

Cypress.Commands.add("enterTableCellValue", (x, y, text) => {
  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] .t--inlined-cell-editor input.bp3-input`,
  )
    .click({ force: true })
    .clear({ force: true });

  if (text) {
    cy.get(
      `[data-colindex="${x}"][data-rowindex="${y}"] .t--inlined-cell-editor input.bp3-input`,
    )
      .focus()
      .type(text)
      .wait(500);
  }
});

Cypress.Commands.add("discardTableCellValue", (x, y) => {
  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] .t--inlined-cell-editor input.bp3-input`,
  ).type("{esc}", { force: true });
});

Cypress.Commands.add("saveTableCellValue", (x, y) => {
  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] .t--inlined-cell-editor input.bp3-input`,
  ).type("{enter}", { force: true });
});

Cypress.Commands.add("saveTableRow", (x, y) => {
  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] button span:contains('Save')`,
  ).click({ force: true });
});

Cypress.Commands.add("AssertTableRowSavable", (x, y) => {
  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] button span:contains('Save')`,
  ).should("exist");

  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] button span:contains('Save')`,
  ).should("not.be.disabled");
});

Cypress.Commands.add("discardTableRow", (x, y) => {
  cy.get(
    `[data-colindex="${x}"][data-rowindex="${y}"] button span:contains('Discard')`,
  ).click({ force: true });
});

Cypress.Commands.add("moveToStyleTab", () => {
  cy.get(commonlocators.propertyStyle).first().click({ force: true });
});

Cypress.Commands.add("moveToContentTab", () => {
  cy.get(commonlocators.propertyContent).first().click({ force: true });
});

Cypress.Commands.add("openPropertyPaneWithIndex", (widgetType, index) => {
  const selector = `.t--draggable-${widgetType}`;
  cy.wait(500);
  cy.get(selector)
    .eq(index)
    .scrollIntoView()
    .trigger("mouseover", { force: true })
    .wait(500);
  cy.get(`${selector}:first-of-type`)
    .eq(index)
    .scrollIntoView()
    .click({ force: true })
    .wait(500);
  cy.get(".t--widget-propertypane-toggle > .t--widget-name")
    .first()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("changeLayoutHeight", (locator) => {
  cy.get(commonlocators.heightProperty)
    .last()
    .scrollIntoView()
    .click({ force: true });
  cy.get(commonlocators.heightPropertyOption)
    .contains(locator)
    .click({ force: true });
  cy.wait("@updateLayout").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("changeLayoutHeightWithoutWait", (locator) => {
  cy.get(commonlocators.heightProperty)
    .last()
    .scrollIntoView()
    .click({ force: true });
  cy.get(commonlocators.heightPropertyOption)
    .contains(locator)
    .click({ force: true });
});

Cypress.Commands.add("checkMinDefaultValue", (endp, value) => {
  cy.get(".cm-m-null")
    .first()
    .invoke("text")
    .then((text) => {
      const someText = text;
      cy.log(someText);
      expect(someText).to.equal(value);
    });
});

Cypress.Commands.add("checkMaxDefaultValue", (endp, value) => {
  cy.get(".cm-m-null")
    .last()
    .invoke("text")
    .then((text) => {
      const someText = text;
      cy.log(someText);
      expect(someText).to.equal(value);
    });
});

Cypress.Commands.add("freezeColumnFromDropdown", (columnName, direction) => {
  cy.get(`[data-header=${columnName}] .header-menu .bp3-popover2-target`).click(
    { force: true },
  );
  cy.get(".bp3-menu")
    .contains(`Freeze column ${direction}`)
    .click({ force: true });

  cy.wait(500);
});

Cypress.Commands.add("sortColumn", (columnName, direction) => {
  cy.get(`[data-header=${columnName}] .header-menu .bp3-popover2-target`).click(
    { force: true },
  );
  cy.get(".bp3-menu")
    .contains(`Sort column ${direction}`)
    .click({ force: true });

  cy.wait(500);
});

Cypress.Commands.add(
  "checkIfColumnIsFrozenViaCSS",
  (rowNum, coumnNum, position = "sticky") => {
    cy.getTableV2DataSelector(rowNum, coumnNum).then((selector) => {
      cy.get(selector).should("have.css", "position", position);
    });
  },
);

Cypress.Commands.add(
  "checkColumnPosition",
  (columnName, expectedColumnPosition) => {
    cy.get(`[data-header]`)
      .eq(expectedColumnPosition)
      .then(($elem) => {
        const dataHeaderAttribute = $elem.attr("data-header");
        expect(dataHeaderAttribute).to.equal(columnName);
      });
  },
);

Cypress.Commands.add("readLocalColumnOrder", (columnOrderKey) => {
  const localColumnOrder = window.localStorage.getItem(columnOrderKey) || "";
  if (localColumnOrder) {
    const parsedTableConfig = JSON.parse(localColumnOrder);
    if (parsedTableConfig) {
      const tableWidgetId = Object.keys(parsedTableConfig)[0];
      return parsedTableConfig[tableWidgetId];
    }
  }
});

Cypress.Commands.add(
  "checkLocalColumnOrder",
  (expectedOrder, direction, columnOrderKey = TABLE_COLUMN_ORDER_KEY) => {
    cy.wait(1000);
    cy.readLocalColumnOrder(columnOrderKey).then((tableWidgetOrder) => {
      if (tableWidgetOrder) {
        const { leftOrder: observedLeftOrder, rightOrder: observedRightOrder } =
          tableWidgetOrder;
        if (direction === "left") {
          expect(expectedOrder).to.be.deep.equal(observedLeftOrder);
        }
        if (direction === "right") {
          expect(expectedOrder).to.be.deep.equal(observedRightOrder);
        }
      }
    });
  },
);
Cypress.Commands.add("findAndExpandEvaluatedTypeTitle", () => {
  cy.wait(2500); //for eval popup to open
  cy.get(commonlocators.evaluatedTypeTitle).first().next().find("span").click();
});

/**
 * sourceColumn - Column name that needs to be dragged/picked.
 * targetColumn - Name of the column where the sourceColumn needs to be dropped
 */
Cypress.Commands.add("dragAndDropColumn", (sourceColumn, targetColumn) => {
  const dataTransfer = new DataTransfer();
  cy.get(`[data-header="${sourceColumn}"] [draggable='true']`).trigger(
    "dragstart",
    { force: true, dataTransfer },
  );

  cy.get(`[data-header="${targetColumn}"] [draggable='true']`).trigger("drop", {
    force: true,
    dataTransfer,
  });
  cy.wait(500);
});

Cypress.Commands.add("resizeColumn", (columnName, resizeAmount) => {
  cy.get(`[data-header="${columnName}"] .resizer`)
    .trigger("mousedown")
    .trigger("mousemove", { x: resizeAmount, y: 0, force: true })
    .trigger("mouseup");
});
