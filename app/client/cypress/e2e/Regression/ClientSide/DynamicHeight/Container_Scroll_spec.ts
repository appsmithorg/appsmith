import { agHelper, deployMode } from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation",
  { tags: ["@tag.AutoHeight"] },
  function () {
    it("1. Validate change with auto height width for widgets", function () {
      agHelper.AddDsl("dynamicHeightContainerScrolldsl");
      EditorNavigation.SelectEntityByName("Container1", EntityType.Widget);
      cy.get(".t--widget-textwidget").trigger("mouseover", { force: true }); // Scroll 'sidebar' to its bottom
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
        "Container1",
      ]);
      deployMode.DeployApp();
      cy.get(".t--widget-containerwidget").trigger("mouseover", {
        force: true,
      }); // Scroll 'sidebar' to its bottom
    });
  },
);
