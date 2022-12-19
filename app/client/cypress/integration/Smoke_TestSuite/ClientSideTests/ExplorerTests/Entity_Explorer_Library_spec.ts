import { WIDGET } from "../../../../locators/WidgetLocators";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const explorer = ObjectsRegistry.EntityExplorer;
const installer = ObjectsRegistry.LibraryInstaller;
const aggregateHelper = ObjectsRegistry.AggregateHelper;

describe("Tests JS Libraries", () => {
  it("1. Validates Library install/uninstall", () => {
    explorer.ExpandCollapseEntity("Libraries");
    installer.openInstaller();
    installer.installLibrary("uuidjs", "UUID");
    installer.uninstallLibrary("uuidjs");
    installer.assertUnInstall("uuidjs");
  });
  it("2. Checks for naming collision", () => {
    explorer.DragDropWidgetNVerify(WIDGET.TABLE, 200, 200);
    explorer.NavigateToSwitcher("explorer");
    explorer.RenameEntityFromExplorer("Table1", "jsonwebtoken");
    explorer.ExpandCollapseEntity("Libraries");
    installer.openInstaller();
    installer.installLibrary("jsonwebtoken", "jsonwebtoken", false);
    aggregateHelper.AssertContains("Name collision detected: jsonwebtoken");
  });
});
