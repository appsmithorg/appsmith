import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class Templates {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private homePage = ObjectsRegistry.HomePage;
  public locators = {
    _templatesTab: ".t--templates-tab",
    _forkApp: ".t--fork-template",
    _templateCard: "[data-testid='template-card']",
    _templatesSearchInput: "[data-testid='t--application-search-input']",
    _resultsHeader: "[data-testid='t--application-templates-results-header']",
    _templateViewGoBack: "[data-testid='t--template-view-goback']",
    _templateDialogBox: "[data-testid=t--templates-dialog-component]",
    _closeTemplateDialogBoxBtn: ".ads-v2-modal__content-header-close-button",
    _requestForTemplateBtn: "span:contains('Request for a template')",
  };

  FilterTemplatesByName(query: string) {
    ObjectsRegistry.AggregateHelper.TypeText(
      this.locators._templatesSearchInput,
      query,
    );
    this.agHelper.Sleep();
  }

  AssertResultsHeaderText(
    text: string,
    textPresence: "have.text" | "contain.text" | "not.have.text" = "have.text",
  ) {
    ObjectsRegistry.AggregateHelper.GetNAssertElementText(
      this.locators._resultsHeader,
      text,
      textPresence,
    );
  }

  GetTemplatesCardsList() {
    return cy.get(this.locators._templateCard);
  }

  public SwitchToTemplatesTab() {
    cy.url().then((url) => {
      if (!url.endsWith("applications")) {
        this.homePage.NavigateToHome();
      }
      this.agHelper.GetNClick(this.locators._templatesTab);
      this.agHelper.AssertElementVisibility(
        this.locators._requestForTemplateBtn,
        true,
        0,
        60000,
      ); //giving more time here for templates page to fully load, since there is no intercept validation for same
    });
  }

  RefreshTemplatesPage(
    withDummyData: boolean,
    templateFixture = "Templates/AllowPageImportTemplates.json",
  ) {
    if (withDummyData) {
      cy.fixture(templateFixture).then((templatesData) => {
        cy.intercept(
          {
            method: "GET",
            url: "/api/v1/app-templates",
          },
          {
            statusCode: 200,
            body: templatesData,
          },
        );
      });
    }
    cy.intercept("GET", "/api/v1/app-templates/filters").as("fetchFilters");
    this.agHelper.RefreshPage("fetchFilters");
    this.agHelper.AssertElementVisibility(this.locators._templateCard);
  }
}
