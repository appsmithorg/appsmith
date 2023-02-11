import HomePage from "../../../../locators/HomePage";
import { WIDGET } from "../../../../locators/WidgetLocators";
import { jsEditor } from "../../../../support/Objects/ObjectsCore";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const explorer = ObjectsRegistry.EntityExplorer;
const installer = ObjectsRegistry.LibraryInstaller;
const aggregateHelper = ObjectsRegistry.AggregateHelper;
const homePage = ObjectsRegistry.HomePage;
const deployMode = ObjectsRegistry.DeployMode;
const debuggerHelper = ObjectsRegistry.DebuggerHelper;

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
  it("3. Checks jspdf library", () => {
    explorer.ExpandCollapseEntity("Libraries");
    installer.openInstaller();
    installer.installLibrary("jspdf", "jspdf");
    jsEditor.CreateJSObject(
      `export default {
      myFun1: () => {
        const doc = new jspdf.jsPDF();
        doc.addPage();
        doc.text(20, 100, 'Some Text.');
        return doc.output('datauristring');
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    jsEditor.RunJSObj();
    debuggerHelper.ClickResponseTab();
    aggregateHelper.AssertContains(
      "data:application/pdf;filename=generated.pdf",
    );
  });
  it("4. Checks installation in exported app", () => {
    homePage.NavigateToHome();
    homePage.ImportApp("library_export.json");
    aggregateHelper.AssertContains("true");
  });
  it("5. Checks installation in duplicated app", () => {
    homePage.NavigateToHome();
    homePage.DuplicateApplication("Library_export");
    aggregateHelper.AssertContains("true");
  });
  it("6. Deploy app and check installation", () => {
    deployMode.DeployApp();
    aggregateHelper.AssertContains("true");
    deployMode.NavigateBacktoEditor();
    aggregateHelper.AssertContains("true");
  });
  it("7. Tests library access and installation in public apps", () => {
    let appURL = "";
    cy.get(HomePage.shareApp).click();
    //@ts-expect-error no type access
    cy.enablePublicAccess(true);
    deployMode.DeployApp();
    cy.url().then((url) => {
      appURL = url;
      homePage.LogOutviaAPI();
      cy.visit(appURL);
      aggregateHelper.AssertContains("true");
    });
  });
});
