import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class Templates {
  public locators = {
    _forkApp: ".t--fork-template",
    _templateCard: "[data-testid='template-card']",
    _templatesSearchInput: "[data-testid='t--application-search-input']",
    _resultsHeader: "[data-testid='t--application-templates-results-header']",
    _templateViewGoBack: "[data-testid='t--template-view-goback']",
    templateDialogBox: "[data-testid=t--templates-dialog-component]",
    templateDialogCloseButton: ".ads-v2-modal__content-header-close-button",
    _closeTemplateDialogBoxBtn: ".ads-v2-modal__content-header-close-button",
  };

  FilterTemplatesByName(query: string) {
    return ObjectsRegistry.AggregateHelper.TypeText(
      this.locators._templatesSearchInput,
      query,
    );
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
}
