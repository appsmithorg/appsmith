import {
  entityExplorer,
  propPane,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";


describe("Dynamic Height Width validation with limits", () => {
  before(() => {
    // Create a page with a divider below a button widget and a checkbox widget below a filepicker widget
    // Button widget and filepicker widgets are fixed height widgets
    cy.fixture("DynamicHeightModalDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });