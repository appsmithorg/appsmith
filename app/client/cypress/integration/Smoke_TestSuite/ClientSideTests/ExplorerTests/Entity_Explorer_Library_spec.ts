import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const explorer = ObjectsRegistry.EntityExplorer;
const installer = ObjectsRegistry.LibraryInstaller;

describe("Tests JS Libraries", () => {
  it("1. Validates Library install/uninstall", () => {
    explorer.ExpandCollapseEntity("Libraries");
    installer.openInstaller();
    installer.installLibrary("uuidjs", "UUID");
    installer.uninstallLibrary("uuidjs");
    installer.assertUnInstall("uuidjs");
  });
});
