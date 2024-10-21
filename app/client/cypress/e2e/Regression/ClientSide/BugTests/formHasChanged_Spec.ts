import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "JS Function Execution",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("formChangeDSL");
    });

    it("1. Doesn't show lint errors for 'form.hasChanges'", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.Sleep(4000);
      agHelper.AssertElementAbsence(locator._lintErrorElement);
    });
  },
);
