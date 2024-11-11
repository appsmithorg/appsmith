import PageList from "../../../../../support/Pages/PageList";
const { ObjectsRegistry } = require("../../../../../support/Objects/Registry");
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const homePage = ObjectsRegistry.HomePage;
const agHelper = ObjectsRegistry.AggregateHelper;
const page1 = "Page1";

describe(
  "Iframe Widget functionality",
  { tags: ["@tag.Widget", "@tag.Iframe", "@tag.Binding"] },
  function () {
    it("1.Import application json", function () {
      cy.visit("/applications", { timeout: 60000 });
      homePage.ImportApp("IframeOnSrcDocChange.json");
      cy.wait("@importNewApplication").then((interception) => {
        agHelper.Sleep();
        const { isPartialImport } = interception.response.body.data;
        if (isPartialImport) {
          cy.get(reconnectDatasourceModal.SkipToAppBtn).click({
            force: true,
          });
          cy.wait(2000);
        } else {
          homePage.AssertImportToast();
        }
      });
    });

    it("2.Check the OnSrcDocChange event call on first render", () => {
      agHelper.RefreshPage();
      cy.wait(2000);
      PageList.ShowList();
      PageList.VerifyIsCurrentPage("Page1");
      cy.openPropertyPane("iframewidget");
      cy.testJsontext("srcdoc", "<h1>Hello World!</h1>");
      cy.wait(2000);
      PageList.VerifyIsCurrentPage("Page2");
      EditorNavigation.SelectEntityByName(page1, EntityType.Page);
      PageList.VerifyIsCurrentPage("Page1");
    });
  },
);
