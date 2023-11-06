import HomePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "Tests JS Libraries", () => {
  it("1. Validates Library install/uninstall", () => {
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.OpenInstaller();
    _.installer.installLibrary("uuidjs", "UUID");
    _.installer.uninstallLibrary("uuidjs");
    _.installer.assertUnInstall("uuidjs");
  });

  it("2. Installs the library against a unique namespace when there is a collision with the existing entity", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TABLE, 200, 200);
    _.entityExplorer.NavigateToSwitcher("Explorer");
    _.entityExplorer.RenameEntityFromExplorer("Table1", "jsonwebtoken");
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.OpenInstaller();
    _.installer.installLibrary("jsonwebtoken", "jsonwebtoken_1", true);
  });

  it("3. Checks jspdf library", () => {
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.OpenInstaller();
    _.installer.installLibrary("jspdf", "jspdf");
    _.jsEditor.CreateJSObject(
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
    _.jsEditor.RunJSObj();
    _.debuggerHelper.ClickResponseTab();
    _.agHelper.AssertContains("data:application/pdf;filename=generated.pdf");
  });

  it("4. ESM build should pass installation, uninstallation and reinstallation", () => {
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.OpenInstaller();
    _.installer.installLibraryViaURL(
      "https://cdn.jsdelivr.net/npm/fast-xml-parser@4.2.7/+esm",
      "fast_xml_parser",
    );
    _.agHelper.Sleep(2000);
    // Uninstallation should succeed
    _.installer.uninstallLibrary("fast_xml_parser");
    _.installer.assertUnInstall("fast_xml_parser");

    // Reinstallation should succeed with the same accessor
    _.installer.OpenInstaller();
    _.installer.installLibraryViaURL(
      "https://cdn.jsdelivr.net/npm/fast-xml-parser@4.2.7/+esm",
      "fast_xml_parser",
    );
  });

  it("5. Shows list of recommended libraries", () => {
    const recommendedLibraryNames = ["jsonwebtoken", "jspdf", "bcryptjs"];
    _.entityExplorer.ExpandCollapseEntity("Libraries");
    _.installer.OpenInstaller();
    for (const recommendedLib of recommendedLibraryNames) {
      cy.contains(recommendedLib);
    }
  });

  it("6. Checks installation in exported/forked app", () => {
    _.homePage.NavigateToHome();
    _.homePage.ImportApp("library_export.json");
    _.agHelper.AssertContains("true");
    _.agHelper.WaitUntilAllToastsDisappear();

    //Checks installation in forked app
    _.homePage.NavigateToHome();
    _.homePage.ForkApplication("Library_export");
    _.agHelper.AssertContains("true");
    _.agHelper.WaitUntilAllToastsDisappear();

    //Deploy app and check installation
    _.deployMode.DeployApp();
    _.agHelper.WaitUntilToastDisappear("true");
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.AssertContains("true");
  });

  it("7. Tests library access and installation in public apps", () => {
    let appURL = "";
    cy.get(HomePage.shareApp).click();
    //@ts-expect-error no type access
    cy.enablePublicAccess(true);
    _.deployMode.DeployApp();
    cy.url().then((url) => {
      appURL = url;
      _.homePage.LogOutviaAPI();
      cy.visit(appURL);
      _.agHelper.AssertContains("true");
    });
  });
});
