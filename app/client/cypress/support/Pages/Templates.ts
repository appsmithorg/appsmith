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
  };

  ForkTemplateByName(name: string) {
    return cy
      .contains(this.locators._templateCard, name)
      .find(this.locators._forkApp)
      .click();
  }

  FilterTemplatesByName(query: string) {
    return ObjectsRegistry.AggregateHelper.TypeText(
      this.locators._templatesSearchInput,
      query,
    );
  }

  FilterTemplatesByFunctions(valuesToBeChecked: string[]) {
    return cy
      .get("input[type='checkbox']")
      .check(valuesToBeChecked, { force: true });
  }

  VisitFirstTemplate() {
    return cy.get(this.locators._templateCard).first().click();
  }

  GobackFromTemplateDetailedView() {
    return cy.get(this.locators._templateViewGoBack).click();
  }

  CloseTemplateDialogBox() {
    return cy.get(this.locators.templateDialogCloseButton).click();
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
}
