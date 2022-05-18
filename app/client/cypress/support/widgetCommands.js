/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");

const {
  addMatchImageSnapshotCommand,
} = require("cypress-image-snapshot/command");
const pages = require("../locators/Pages.json");
const commonlocators = require("../locators/commonlocators.json");
const modalWidgetPage = require("../locators/ModalWidget.json");
const widgetsPage = require("../locators/Widgets.json");
const LayoutPage = require("../locators/Layout.json");
const formWidgetsPage = require("../locators/FormWidgets.json");
const apiwidget = require("../locators/apiWidgetslocator.json");
const dynamicInputLocators = require("../locators/DynamicInput.json");
const viewWidgetsPage = require("../locators/ViewWidgets.json");
const generatePage = require("../locators/GeneratePage.json");

let pageidcopy = " ";

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("changeZoomLevel", (zoomValue) => {
  cy.get(commonlocators.changeZoomlevel)
    .last()
    .click();
  cy.get(".t--dropdown-option")
    .children()
    .contains(zoomValue)
    .click();
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

Cypress.Commands.add("changeColumnType", (dataType) => {
  cy.get(commonlocators.changeColType)
    .last()
    .click();
  cy.get(".t--dropdown-option")
    .children()
    .contains(dataType)
    .click();
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
});

Cypress.Commands.add("switchToPaginationTab", () => {
  cy.get(apiwidget.paginationTab)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("selectDateFormat", (value) => {
  cy.get(".t--property-control-dateformat .bp3-popover-target")
    .last()
    .click({ force: true });
  cy.get(".t--dropdown-option")
    .children()
    .contains(value)
    .click({ force: true });
});

Cypress.Commands.add("selectDropdownValue", (element, value) => {
  cy.get(element)
    .last()
    .click();
  cy.get(".t--dropdown-option")
    .children()
    .contains(value)
    .click();
});

Cypress.Commands.add("assertDateFormat", () => {
  cy.get(".t--draggable-datepickerwidget2 input")
    .first()
    .invoke("attr", "value")
    .then((text) => {
      const firstTxt = text;
      cy.log("date time : ", firstTxt);
      cy.get(commonlocators.labelTextStyle)
        .first()
        .should("contain", firstTxt);
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
  cy.xpath(apiwidget.popover)
    .last()
    .click({ force: true });
  cy.get(apiwidget.copyTo).click({ force: true });
  cy.get(apiwidget.page)
    .contains(pageName)
    .click();
  cy.wait("@createNewJSCollection").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("AddActionWithModal", () => {
  cy.get(commonlocators.dropdownSelectButton)
    .last()
    .click();
  cy.get(".single-select")
    .contains("Open modal")
    .click({ force: true });
  cy.get(modalWidgetPage.selectModal).click();
  cy.get(modalWidgetPage.createModalButton).click({ force: true });
});

Cypress.Commands.add("createModal", (ModalName) => {
  cy.get(widgetsPage.actionSelect)
    .first()
    .click({ force: true });
  cy.selectOnClickOption("Open modal");
  cy.get(modalWidgetPage.selectModal).click();
  cy.wait(2000);
  cy.get(modalWidgetPage.createModalButton).click({ force: true });
  cy.wait(3000);
  cy.assertPageSave();
  cy.SearchEntityandOpen("Modal1");
  // changing the model name verify
  cy.widgetText(
    ModalName,
    modalWidgetPage.modalName,
    modalWidgetPage.modalName,
  );

  //changing the Model label
  cy.get(modalWidgetPage.modalWidget + " " + widgetsPage.textWidget)
    .first()
    .trigger("mouseover");

  cy.get(widgetsPage.textWidget + " " + commonlocators.editIcon).click();
  cy.testCodeMirror(ModalName);
  cy.get(widgetsPage.textCenterAlign).click({ force: true });
  cy.assertPageSave();
  cy.get(".bp3-overlay-backdrop").click({ force: true });
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
  cy.assertPageSave();
});

Cypress.Commands.add("UncheckWidgetProperties", (checkboxCss) => {
  cy.get(checkboxCss).uncheck({
    force: true,
  });
  cy.assertPageSave();
});

Cypress.Commands.add("EditWidgetPropertiesUsingJS", (checkboxCss, inputJS) => {
  cy.get(checkboxCss, { timeout: 10000 })
    .last()
    .should("exist")
    .dblclick({ force: true })
    .type(inputJS);
  cy.assertPageSave();
});

Cypress.Commands.add(
  "ChangeTextStyle",
  (dropDownValue, textStylecss, labelName) => {
    cy.get(commonlocators.dropDownIcon)
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains(dropDownValue)
      .click();
    cy.get(textStylecss).should("have.text", labelName);
  },
);

Cypress.Commands.add("widgetText", (text, inputcss, innercss) => {
  cy.get(commonlocators.editWidgetName)
    .click({ force: true })
    .type(text, { delay: 300 })
    .type("{enter}");
  cy.get(inputcss)
    .first()
    .trigger("mouseover", { force: true });
  cy.contains(innercss, text);
});

Cypress.Commands.add("verifyWidgetText", (text, inputcss, innercss) => {
  cy.get(inputcss)
    .first()
    .trigger("mouseover", { force: true });
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
  cy.get(commonlocators.editWidgetName)
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
  return cy
    .get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}");
});

Cypress.Commands.add("testCodeMirror", (value) => {
  cy.get(".CodeMirror textarea")
    .first()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .first()
          .clear({
            force: true,
          });
      }

      cy.get(".CodeMirror textarea")
        .first()
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.get(".CodeMirror textarea")
        .first()
        .should("have.value", value);
    });
});

Cypress.Commands.add("updateComputedValue", (value) => {
  cy.get(".CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea")
        .first()
        .clear({
          force: true,
        });
    }
    cy.get(".CodeMirror textarea")
      .first()
      .type(value, {
        force: true,
        parseSpecialCharSequences: false,
      });
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("testCodeMirrorLast", (value) => {
  cy.get(".CodeMirror textarea")
    .last()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .last()
          .clear({
            force: true,
          });
      }

      cy.get(".CodeMirror textarea")
        .last()
        .clear({ force: true })
        .type(value, {
          force: true,
          parseSpecialCharSequences: false,
        });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
      cy.get(".CodeMirror textarea")
        .last()
        .should("have.value", value);
    });
});

Cypress.Commands.add("testJsontext", (endp, value, paste = true) => {
  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
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

/**
 * Usage:
 * Find the element which has a code editor input and then pass it in the function
 *
 * cy.get(...).then(el => cy.updateCodeInput(el, "test"));
 *
 */
Cypress.Commands.add("updateCodeInput", ($selector, value) => {
  cy.get($selector)
    .find(".CodeMirror")
    .first()
    .then((ins) => {
      const input = ins[0].CodeMirror;
      input.focus();
      cy.wait(200);
      input.setValue(value);
      cy.wait(200); //time for value to set
      //input.focus();
    });
});

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
  cy.get(".CodeMirror textarea")
    .last()
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea")
        .last()
        .clear({
          force: true,
        });
    }
    cy.get(".CodeMirror textarea")
      .last()
      .type(value, {
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
  cy.get("[data-rbd-draggable-id='" + columnName + "'] input")
    .scrollIntoView()
    .first()
    .focus({ force: true })
    .should("be.visible");
});

Cypress.Commands.add("tableColumnPopertyUpdate", (colId, newColName) => {
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
  cy.get(".draggable-header ")
    .contains(newColName)
    .should("be.visible");
});

Cypress.Commands.add("hideColumn", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("showColumn", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  cy.get(".draggable-header ")
    .contains(colId)
    .should("be.visible");
});
Cypress.Commands.add("deleteColumn", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--delete-column-btn").click(
    {
      force: true,
    },
  );
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("openFieldConfiguration", (fieldIdentifier) => {
  cy.get(
    "[data-rbd-draggable-id='" + fieldIdentifier + "'] .t--edit-column-btn",
  ).click({
    force: true,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("deleteJSONFormField", (fieldIdentifier) => {
  cy.get(
    "[data-rbd-draggable-id='" + fieldIdentifier + "'] .t--delete-column-btn",
  ).click({
    force: true,
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("makeColumnVisible", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--show-column-btn").click({
    force: true,
  });
  cy.wait(1000);
});

Cypress.Commands.add("addColumn", (colId) => {
  cy.get(widgetsPage.addColumn).scrollIntoView();
  cy.get(widgetsPage.addColumn)
    .should("be.visible")
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(3000);
  cy.get(widgetsPage.defaultColName).clear({
    force: true,
  });
  cy.get(widgetsPage.defaultColName).type(colId, { force: true });
});

Cypress.Commands.add("editColumn", (colId) => {
  cy.get("[data-rbd-draggable-id='" + colId + "'] .t--edit-column-btn").click();
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

Cypress.Commands.add("addAction", (value) => {
  cy.get(commonlocators.dropdownSelectButton)
    .last()
    .click();
  cy.get(commonlocators.chooseAction)
    .children()
    .contains("Show message")
    .click();
  cy.enterActionValue(value);
});

Cypress.Commands.add("onTableAction", (value, value1, value2) => {
  cy.get(commonlocators.dropdownSelectButton)
    .eq(value)
    .click();
  cy.get(commonlocators.chooseAction)
    .children()
    .contains("Show message")
    .click();
  cy.testJsontext(value1, value2);
});

Cypress.Commands.add("selectShowMsg", () => {
  cy.get(commonlocators.chooseAction)
    .children()
    .contains("Show message")
    .click();
});

Cypress.Commands.add("addSuccessMessage", (value) => {
  cy.get(commonlocators.chooseMsgType)
    .last()
    .click();
  cy.get(commonlocators.chooseAction)
    .children()
    .contains("Success")
    .click();
  cy.enterActionValue(value);
});

Cypress.Commands.add("SetDateToToday", () => {
  cy.get(formWidgetsPage.datepickerFooterPublish)
    .contains("Today")
    .click({ force: true });
  cy.assertPageSave();
});

Cypress.Commands.add("enterActionValue", (value) => {
  cy.get(".CodeMirror textarea")
    .last()
    .focus()
    .type("{ctrl}{shift}{downarrow}")
    .then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .last()
          .clear({
            force: true,
          });
      }

      cy.get(".CodeMirror textarea")
        .last()
        .type(value, {
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
            cy.get(".CodeMirror textarea")
              .first()
              .clear({
                force: true,
              });
          }
          cy.get(".CodeMirror textarea")
            .first()
            .type(value, {
              force: true,
              parseSpecialCharSequences: false,
            });
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(200);
          cy.get(".CodeMirror textarea")
            .first()
            .should("have.value", value);
        });
      cy.root();
    });
});

Cypress.Commands.add("ClearDate", () => {
  cy.get(".t--property-control-defaultdate input").clear();
  cy.assertPageSave();
});

Cypress.Commands.add("ClearDateFooter", () => {
  cy.get(formWidgetsPage.datepickerFooterPublish)
    .contains("Clear")
    .click({ force: true });
  //cy.assertPageSave();
});

Cypress.Commands.add("DeleteModal", () => {
  cy.get(widgetsPage.textbuttonWidget).dblclick("topRight", { force: true });
  cy.get(widgetsPage.deleteWidget)
    .first()
    .click({ force: true });
});

Cypress.Commands.add("Createpage", (pageName) => {
  let pageId;
  cy.get(pages.AddPage)
    .first()
    .click({ force: true });
  cy.wait("@createPage").then((xhr) => {
    expect(xhr.response.body.responseMeta.status).to.equal(201);
    if (pageName) {
      pageId = xhr.response.body.data.id;
      cy.wait(2000);
      cy.get(`div[id=entity-${pageId}] .t--context-menu`).click({
        force: true,
      });
      cy.get(pages.editName).click({ force: true });
      cy.get(pages.editInput).type(pageName + "{enter}");
      pageidcopy = pageName;
      cy.wrap(pageId).as("currentPageId");
    }
    cy.get(generatePage.buildFromScratchActionCard).click();
    cy.get("#loading").should("not.exist");
  });
});

Cypress.Commands.add("Deletepage", (Pagename) => {
  cy.CheckAndUnfoldEntityItem("PAGES");
  cy.get(`.t--entity-item:contains(${Pagename})`).within(() => {
    cy.get(".t--context-menu").click({ force: true });
  });
  cy.selectAction("Delete");
  cy.selectAction("Are you sure?");
  cy.wait("@deletePage");
  cy.get("@deletePage").should("have.property", "status", 200);
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
  cy.get(commonlocators.dropdownmenu)
    .contains(text)
    .click({ force: true });
  cy.xpath(commonlocators.dropDownOptSelected).should("have.text", text);
});

Cypress.Commands.add("selectTextSize", (text) => {
  cy.get(".t--dropdown-option")
    .first()
    .contains(text)
    .click({ force: true });
});

Cypress.Commands.add("selectTxtSize", (text) => {
  cy.get(".t--dropdown-option")
    .contains(text)
    .click({ force: true });
});

Cypress.Commands.add("getAlert", (alertcss) => {
  cy.get(commonlocators.dropdownSelectButton).click({ force: true });
  cy.get(widgetsPage.menubar)
    .contains("Show Alert")
    .click({ force: true })
    .should("have.text", "Show Alert");

  cy.get(alertcss)
    .click({ force: true })
    .type("hello");
  cy.get(".t--open-dropdown-Select-type").click({ force: true });
  cy.get(".bp3-popover-content .bp3-menu li")
    .contains("Success")
    .click({ force: true });
});

Cypress.Commands.add("togglebar", (value) => {
  cy.get(value)
    .check({ force: true })
    .should("be.checked");
});
Cypress.Commands.add("togglebarDisable", (value) => {
  cy.get(value)
    .uncheck({ force: true })
    .should("not.checked");
});

Cypress.Commands.add(
  "getAlert",
  (alertcss, propertyControl = commonlocators.dropdownSelectButton) => {
    cy.get(propertyControl)
      .first()
      .click({ force: true });
    cy.get(widgetsPage.menubar)
      .contains("Show message")
      .click({ force: true });

    cy.get(alertcss)
      .click({ force: true })
      .type("hello");
    cy.get(".t--open-dropdown-Select-type").click({ force: true });
    cy.get(".bp3-popover-content .bp3-menu li")
      .contains("Success")
      .click({ force: true });
  },
);

Cypress.Commands.add("addQueryFromLightningMenu", (QueryName) => {
  cy.get(commonlocators.dropdownSelectButton)
    .first()
    .click({ force: true })
    .selectOnClickOption("Execute a query")
    .selectOnClickOption(QueryName);
});

Cypress.Commands.add("addAPIFromLightningMenu", (ApiName) => {
  cy.get(commonlocators.dropdownSelectButton)
    .first()
    .click({ force: true })
    .selectOnClickOption("Execute a query")
    .selectOnClickOption(ApiName);
});

Cypress.Commands.add("radioInput", (index, text) => {
  cy.get(widgetsPage.RadioInput)
    .eq(index)
    .click({ force: true })
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
  cy.get(selector)
    .first()
    .trigger("mouseover", { force: true })
    .wait(500);
  cy.get(
    `${selector}:first-of-type .t--widget-propertypane-toggle > .t--widget-name`,
  )
    .first()
    .click({ force: true });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});

Cypress.Commands.add("openPropertyPaneCopy", (widgetType) => {
  if (widgetType === "List1Copy") {
    cy.SearchEntityandOpen(widgetType);
  } else {
    const selector = `.t--draggable-${widgetType}`;
    cy.get(selector)
      .last()
      .trigger("mouseover", { force: true })
      .wait(500);
    cy.get(
      `${selector}:first-of-type .t--widget-propertypane-toggle > .t--widget-name`,
    )
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
  }
});

Cypress.Commands.add("copyWidget", (widget, widgetLocator) => {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  //Copy widget and verify all properties
  cy.get(widgetsPage.propertypaneText)
    .children()
    .last()
    .invoke("text")
    .then((x) => {
      cy.log(x);
      let originalWidget = x.replaceAll("x", "");
      originalWidget = originalWidget.replaceAll(/\u200B/g, "");
      cy.log(originalWidget);
      cy.get(widgetsPage.copyWidget).click({ force: true });
      cy.wait(2000);
      cy.reload();
      // Wait for the widget to be appear in the DOM and press Ctrl/Cmd + V to paste the button.
      cy.get(widgetLocator).should("be.visible");
      cy.get("body").type(`{${modifierKey}}v`);
      cy.wait(2000);
      cy.openPropertyPaneCopy(widget);
      cy.get(widgetsPage.propertypaneText)
        .children()
        .last()
        .invoke("text")
        .then((y) => {
          cy.log(y);
          let copiedWidget = y.replaceAll("x", "");
          copiedWidget = copiedWidget.replaceAll(/\u200B/g, "");
          cy.log(copiedWidget);
          expect(originalWidget).to.be.equal(copiedWidget);
        });
    });
});

Cypress.Commands.add("deleteWidget", () => {
  // Delete the button widget
  cy.get(widgetsPage.removeWidget).click({ force: true });
  cy.wait(5000);
  cy.wait("@updateLayout");
});

Cypress.Commands.add("UpdateChartType", (typeOfChart) => {
  // Command to change the chart type if the property pane of the chart widget is opened.
  cy.get(viewWidgetsPage.chartType)
    .last()
    .click({ force: true });
  cy.get(commonlocators.dropdownmenu)
    .children()
    .contains(typeOfChart)
    .click({ force: true });

  cy.get(viewWidgetsPage.chartType + " span.cs-text").should(
    "have.text",
    typeOfChart,
  );
});

Cypress.Commands.add("alertValidate", (text) => {
  cy.get(commonlocators.success)
    .should("be.visible")
    .and("have.text", text);
});

Cypress.Commands.add("ExportVerify", (togglecss, name) => {
  cy.togglebar(togglecss);
  cy.get(".t--draggable-tablewidget button")
    .invoke("attr", "aria-label")
    .should("contain", name);
  cy.togglebarDisable(togglecss);
});

Cypress.Commands.add("getTableDataSelector", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div div`;
  return selector;
});

Cypress.Commands.add("readTabledata", (rowNum, colNum) => {
  // const selector = `.t--draggable-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
  const selector = `.tbody .td[data-rowindex="${rowNum}"][data-colindex="${colNum}"] div div`;
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
  "readTabledataFromSpecificIndex",
  (rowNum, colNum, index) => {
    // const selector = `.t--widget-tablewidget .e-gridcontent.e-lib.e-droppable td[index=${rowNum}][aria-colindex=${colNum}]`;
    const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div`;
    const tabVal = cy
      .get(selector)
      .eq(index)
      .invoke("text");
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
  const tabVal = cy
    .get(selector)
    .scrollIntoView()
    .invoke("text");
  return tabVal;
});

Cypress.Commands.add("readTableLinkPublish", (rowNum, colNum) => {
  const selector = `.t--widget-tablewidget .tbody .td[data-rowindex=${rowNum}][data-colindex=${colNum}] div .image-cell-wrapper .image-cell`;
  const bgUrl = cy.get(selector).should("have.css", "background-image");
  return bgUrl;
});

Cypress.Commands.add("assertEvaluatedValuePopup", (expectedType) => {
  cy.get(commonlocators.evaluatedTypeTitle)
    .first()
    .find("span")
    .click();
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
  cy.get(".CodeMirror textarea")
    .eq(value)
    .focus({ force: true })
    .type("{uparrow}", { force: true })
    .type("{ctrl}{shift}{downarrow}", { force: true });
  cy.focused().then(($cm) => {
    if ($cm.contents !== "") {
      cy.log("The field is empty");
      cy.get(".CodeMirror textarea")
        .eq(value)
        .clear({
          force: true,
        });
    }
  });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000);
});
Cypress.Commands.add("deleteQueryOrJS", (Action) => {
  cy.CheckAndUnfoldEntityItem("QUERIES/JS");
  cy.get(`.t--entity-item:contains(${Action})`).within(() => {
    cy.get(".t--context-menu").click({ force: true });
  });
  cy.selectAction("Delete");
  cy.selectAction("Are you sure?");
  cy.wait("@deleteAction");
  cy.get("@deleteAction").should("have.property", "status", 200);
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
