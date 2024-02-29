import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class Templates {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private homePage = ObjectsRegistry.HomePage;
  public locators = {
    _templatesTab: ".t--templates-tab",
    _forkApp: ".t--fork-template",
    _templateCard: "[data-testid='template-card']",
    _templateViewForkButton: "[data-testid='template-fork-button']",
    _buildingBlockCardOnCanvas: "[data-testid='t--canvas-building-block-item']",
    _datasourceConnectPromptSubmitBtn:
      "[data-testid='t--datasource-connect-prompt-submit-btn']",
    _templatesSearchInput: "[data-testid='t--application-search-input']",
    _resultsHeader: "[data-testid='t--application-templates-results-header']",
    _templateViewGoBack: "[data-testid='t--template-view-goback']",
    _templateDialogBox: "[data-testid=t--templates-dialog-component]",
    _closeTemplateDialogBoxBtn: ".ads-v2-modal__content-header-close-button",
    _requestForTemplateBtn: "span:contains('Request for a template')",
    _tempaltesFilterItem: "[data-testid='t--templates-filter-item']",
    _templateFilterItemSelectedIcon: `[data-testid="t--templates-filter-item-selected-icon"]`,
    _templatesCardForkButton: "[data-testid='t--fork-template-button']",
  };

  FilterTemplatesByName(query: string) {
    ObjectsRegistry.AggregateHelper.TypeText(
      this.locators._templatesSearchInput,
      query,
    );
    this.agHelper.Sleep();
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

  FilterByFirst2Categories() {
    return this.agHelper
      .GetElement(this.locators._tempaltesFilterItem)
      .then((categories) => {
        const first2Categories = categories.slice(1, 3);
        first2Categories.map((_, category) => {
          cy.wrap(category).click();
        });
      });
  }
}
