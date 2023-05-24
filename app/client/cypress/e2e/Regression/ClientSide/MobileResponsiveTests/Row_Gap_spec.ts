import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import {
  ROW_GAP,
  MOBILE_ROW_GAP,
} from "../../../../../src/utils/autoLayout/constants";

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane;

describe("Validating use cases for Auto Dimension", () => {
  before(() => {
    propPane.ConvertToAutoLayout();
    ee.DragDropWidgetNVerify("inputwidgetv2", 100, 20);
    ee.DragDropWidgetNVerify("inputwidgetv2", 5, 10);
    ee.DragDropWidgetNVerify("inputwidgetv2", 100, 75);
  });

  it(`Validating row gap of ${ROW_GAP}px for desktop view`, () => {
    cy.get(".t--widget-input1").then((widget) => {
      const input1Bottom = widget.get(0).getBoundingClientRect().bottom;
      cy.get(".t--widget-input3").then((widget) => {
        const input3Top = widget.get(0).getBoundingClientRect().top;
        // Subtracting 4px to account for the bounding box border width
        expect(input3Top - input1Bottom - 4).to.be.equal(ROW_GAP);
      });
    });
  });

  it(`Validating row gap of ${MOBILE_ROW_GAP}px for mobile view (non-wrapped widgets)`, () => {
    agHelper.SetCanvasViewportWidth(375);
    agHelper.Sleep();
    cy.get(".t--widget-input1").then((widget) => {
      const input1Bottom = widget.get(0).getBoundingClientRect().bottom;
      cy.get(".t--widget-input3").then((widget) => {
        const input3Top = widget.get(0).getBoundingClientRect().top;
        // Subtracting 4px to account for the bounding box border width
        expect(input3Top - input1Bottom - 4).to.be.equal(MOBILE_ROW_GAP);
      });
    });
  });

  it(`Validating row gap of ${MOBILE_ROW_GAP}px for mobile view - (wrapped widgets)`, () => {
    cy.get(".t--widget-input2").then((widget) => {
      const input2Bottom = widget.get(0).getBoundingClientRect().bottom;
      cy.get(".t--widget-input1").then((widget) => {
        const input1Top = widget.get(0).getBoundingClientRect().top;
        // Subtracting 4px to account for the bounding box border width
        expect(input1Top - input2Bottom - 4).to.be.equal(MOBILE_ROW_GAP);
      });
    });
  });
});
