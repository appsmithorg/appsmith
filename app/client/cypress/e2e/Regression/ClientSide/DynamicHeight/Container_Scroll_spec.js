import {
  agHelper,
  entityExplorer,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    agHelper.AddDsl("dynamicHeightContainerScrolldsl");
    entityExplorer.SelectEntityByName("Container1");
    cy.get(".t--widget-textwidget").trigger("mouseover", { force: true }); // Scroll 'sidebar' to its bottom
    entityExplorer.SelectEntityByName("Text1", "Container1");
    deployMode.DeployApp();
    cy.get(".t--widget-containerwidget").trigger("mouseover", { force: true }); // Scroll 'sidebar' to its bottom
  });
});
