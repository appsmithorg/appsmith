import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const locator = ObjectsRegistry.CommonLocators,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("JS Function Execution", function () {
  before(() => {
    agHelper.AddDsl("formWithtabdsl");
  });

  it("1. Doesn't show lint errors for 'form.hasChanges' for form in inactive tab", () => {
    EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
    agHelper.Sleep(4000);
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
});
