const widgets = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  fakerHelper,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import { progressWidgetProgress } from "../../../../../locators/WidgetLocators";

describe(
  "Progress Widget",
  { tags: ["@tag.Widget", "@tag.Progress", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.PROGRESS);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 500, 200);
      propPane.UpdatePropertyFieldValue("Text", "");
    });

    // Linear progress
    it("1. Property: isIndeterminate, Toggle infinite loading", function () {
      cy.openPropertyPane("progresswidget");
      // enable infinite loading
      agHelper.CheckUncheck(widgets.infiniteLoading);
      // show indeterminate linear progress
      cy.get("[data-testid='indeterminate-linear-progress']")
        .should("exist")
        .should("have.css", "animation");
      // disable infinite loading
      agHelper.CheckUncheck(widgets.infiniteLoading, false);
      // show determinate linear progress
      cy.get("[data-testid='50']").should("exist");
    });
    it("2.Property: value, Change progress value", function () {
      cy.updateCodeInput(".t--property-control-progress", "60");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // pass 60
      cy.get("[data-testid='60']").should("exist");
    });
    it("3. Property: showResult, Toggle show result", function () {
      // enable show result
      agHelper.CheckUncheck(widgets.showResult);
      // show label
      cy.get("[data-testid='60']").first().next().should("contain.text", "60");
      // disable show result
      agHelper.CheckUncheck(widgets.showResult, false);
      // does not show any label
      cy.get("[data-testid='60']").first().next().should("not.exist");
    });
    it("4. Property: steps, Change steps", function () {
      cy.updateCodeInput(".t--property-control-numberofsteps", "2");
      // show progress with steps
      cy.get("[data-testid='step']").should("have.length", 2);
      cy.updateCodeInput(".t--property-control-numberofsteps", "1");
      // does not show progress with steps
      cy.get("[data-testid='step']").should("not.exist");
    });

    // Circular progress
    it("5. Property: type, Change type to Circular", function () {
      // Switch to circular mode
      cy.get("[data-value='circular']").click({ force: true });
      cy.get("[data-testid='circular']").should("exist");
    });
    it("6. Property: isIndeterminate, Toggle infinite loading", function () {
      cy.openPropertyPane("progresswidget");
      // enable infinite loading
      agHelper.CheckUncheck(widgets.infiniteLoading);
      // show indeterminate linear progress
      cy.get("[data-testid='circular']")
        .should("exist")
        .should("have.css", "animation");
      // disable infinite loading
      agHelper.CheckUncheck(widgets.infiniteLoading, false);
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });
    it("7. Property: value, Change progress value", function () {
      cy.updateCodeInput(".t--property-control-progress", "50");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      // The path element with 50 should exist
      cy.get("[data-testvalue='50']").should("exist");
    });
    it("8. Property: showResult, Toggle show result", function () {
      // enable show result
      agHelper.CheckUncheck(widgets.showResult);
      // show label
      cy.get("[data-testid='circular-label']").should("contain.text", "50");
      // disable show result
      agHelper.CheckUncheck(widgets.showResult, false);
      // does not show any label
      cy.get("[data-testid='circular-label']").should("not.exist");
    });
    it("9. Property: steps, Change steps", function () {
      cy.updateCodeInput(".t--property-control-numberofsteps", "2");
      // show circular progress with steps
      cy.get("[data-testid='separator']").should("have.length", 2);
      cy.updateCodeInput(".t--property-control-numberofsteps", "1");
      // does not show progress with steps
      cy.get("[data-testid='separator']").should("not.exist");
    });
    it("10. Property: counterClockwise,Change counterclockwise", function () {
      // enable counterclockwise
      agHelper.CheckUncheck(widgets.counterclockwise);
      // show the progress in a counterclockwise
      cy.get("[data-testvalue='50']")
        .invoke("css", "stroke-dashoffset")
        .and("match", /-/);
      // disable counterclockwise
      agHelper.CheckUncheck(widgets.counterclockwise, false);
      // show the progress in a clockwise
      cy.get("[data-testvalue='50']")
        .invoke("css", "stroke-dashoffset")
        .should("not.match", /-/);
    });

    it("11. The binding property, progress should be exposed for an auto suggestion", function () {
      cy.openPropertyPane("textwidget");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{Progress1.",
        { force: true },
      );
      cy.get("ul.CodeMirror-hints").contains("progress").should("exist");
    });

    it("12. Check Progress, Number of steps, Counterclockwise, Show result disabled on infite looping enablement", function () {
      //  on enabling infite loading assert the absence of elements
      agHelper.GetNClick(widgets.progressWidget);
      propPane.TogglePropertyState("Infinite loading", "On");
      agHelper.AssertElementAbsence(propPane._labelContains("Progress"));
      agHelper.AssertElementAbsence(propPane._labelContains("Number of steps"));
      agHelper.AssertElementAbsence(
        propPane._labelContains("Counterclockwise"),
      );
      agHelper.AssertElementAbsence(propPane._labelContains("Show result"));
      propPane.TogglePropertyState("Infinite loading", "Off");
    });

    it("13. Check binding in Progress ", function () {
      agHelper.GetNClick(widgets.linearProgressWidget);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 600, 100);
      agHelper.GetNClick(widgets.progressWidget);
      // assert error texts in Progress property
      propPane.UpdatePropertyFieldValue("Progress", "-1");
      agHelper.VerifyEvaluatedErrorMessage("Minimum allowed value: 0");
      propPane.UpdatePropertyFieldValue(
        "Progress",
        fakerHelper.GetRandomText(),
      );
      agHelper.VerifyEvaluatedErrorMessage(
        "This value does not evaluate to type number Max: 100",
      );
      propPane.UpdatePropertyFieldValue("Progress", "101");
      agHelper.VerifyEvaluatedErrorMessage("Maximum allowed value: 100");
      // set input entered in text widget to progress
      propPane.UpdatePropertyFieldValue("Progress", "{{Input1.text}}");
      deployMode.DeployApp();
      agHelper.EnterInputText("Label", "10");
      // assert if the text in text widget is reflected in progress bar
      agHelper.AssertElementExist(progressWidgetProgress("10"));
      agHelper.EnterInputText("Label", "20", true);
      agHelper.AssertElementExist(progressWidgetProgress("20"));
      deployMode.NavigateBacktoEditor();
    });

    it("14. Check progress widget visibility based on visible state - Deploy mode", function () {
      agHelper.GetNClick(widgets.progressWidget);
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(widgets.progressWidget);
      deployMode.NavigateBacktoEditor();
      agHelper.GetNClick(widgets.progressWidget);
      propPane.TogglePropertyState("Visible", "On");
      deployMode.DeployApp();
      agHelper.AssertElementExist(widgets.progressWidget);
      agHelper.GetNClick(widgets.progressWidget);
    });
  },
);
