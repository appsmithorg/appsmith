const widgetsPage = require("../../../../../locators/Widgets.json");
const testdata = require("../../../../../fixtures/testdata.json");
import {
  agHelper,
  entityExplorer,
  draggableWidgets,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Video Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Video", "@tag.Binding"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.VIDEO);
    });

    it("1. Video Widget play functionality validation", function () {
      cy.openPropertyPane("videowidget");
      cy.getAlert("onPlay", "Play success");
      cy.get(widgetsPage.autoPlay).click();
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Play success");
    */
    });

    it("2. Video widget pause functionality validation", function () {
      cy.getAlert("onPause", "Pause success");
      cy.get(widgetsPage.autoPlay).click();
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Pause success");
    */
    });

    it("3. Update video url and check play and pause functionality validation", function () {
      cy.testCodeMirror(testdata.videoUrl);
      cy.get(".CodeMirror textarea").first().blur();
      cy.get(widgetsPage.autoPlay).click({ force: true });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Play success");
    */
      cy.get(widgetsPage.autoPlay).click({ force: true });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Pause success");
    */
    });

    it("4. Checks if video widget is reset on button click", function () {
      propPane.UpdatePropertyFieldValue("URL", testdata.videoUrl2);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 400);

      cy.selectResetWidget("onClick");
      cy.selectWidgetForReset("Video1");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 300, 600);
      propPane.UpdatePropertyFieldValue("Text", "{{Video1.playState}}");
      agHelper.Sleep(1500); // Wait time added for the widget to load current video state

      cy.openPropertyPane("videowidget");
      propPane.TogglePropertyState("Autoplay", "On");
      agHelper.Sleep(1500); // Wait time added for the widget to load current video state
      cy.get(".t--widget-textwidget").should("contain", "ENDED");

      propPane.TogglePropertyState("Autoplay", "Off");
      agHelper.Sleep(1500); // Wait time added, allowing a second to pass between playing and pausing the widget, before it is reset to zero
      cy.get(".t--widget-textwidget").should("contain", "PAUSED");

      agHelper.ClickButton("Submit");
      cy.wait(1000);
      cy.get(`${widgetsPage.videoWidget} video`).then(($video) => {
        const video = $video.get(0);
        expect(video.currentTime).to.equal(0);
      });
      agHelper.Sleep(1500); // Wait time added for the widget to load current video state
      cy.get(".t--widget-textwidget").should("contain", "NOT_STARTED");
    });

    afterEach(() => {
      // put your clean up code if any
    });
  },
);
