class Response {
  public locators = {
    responseTab: "[data-testid='t--tab-RESPONSE_TAB']",
    responseDataContainer: "[data-testid='t--query-response-data-container']",
    responseTypeMenuTrigger: "[data-testid='t--query-response-type-trigger']",
    responseRecordCount: "[data-testid='t--query-response-record-count']",

    /** @deprecated */
    responseType(type: string): string {
      return `//div[@data-testid='t--response-tab-segmented-control']//span[text()='${type}']`;
    },

    responseTypeMenuItem(type: string) {
      return `[data-testid="t--query-response-type-menu-item"][data-value="${type}"]`;
    },
  };

  /** @deprecated */
  public getResponseTypeSelector = this.locators.responseType;

  /** @deprecated */
  public switchResponseType(type: string): void {
    this.switchToResponseTab();
    cy.xpath(this.locators.responseType(type)).click({ force: true });
  }

  public switchToResponseTab(): void {
    cy.get(this.locators.responseTab).click({ force: true });
  }

  public openResponseTypeMenu() {
    cy.get(this.locators.responseDataContainer).realHover();
    cy.get(this.locators.responseTypeMenuTrigger).click({ force: true });
  }

  public selectResponseResponseTypeFromMenu(type: string): void {
    this.switchToResponseTab();
    this.openResponseTypeMenu();
    cy.get(this.locators.responseTypeMenuItem(type)).realClick();
  }

  public closeResponseTypeMenu() {
    cy.get(this.locators.responseTypeMenuTrigger).realClick();
  }

  public validateRecordCount(count: number): void {
    cy.get(this.locators.responseRecordCount)
      .invoke("text")
      .should("match", new RegExp(`^${count}\\b`));
  }
}

export { Response };
