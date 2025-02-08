type ComparisonOperator = "eq" | "gt" | "gte" | "lt" | "lte";

interface ValidationParams {
  count: number;
  operator?: ComparisonOperator;
}

class Response {
  public locators = {
    responseTab: "[data-testid='t--tab-RESPONSE_TAB']",
    responseDataContainer: "[data-testid='t--response-data-container']",
    responseTypeMenuTrigger: "[data-testid='t--response-type-trigger']",
    responseRecordCount: "[data-testid='t--response-record-count']",
    responseStatusInfo: "[data-testid='t--response-status-info']",
    responseStatusInfoTooltip: "#t--response-tooltip",

    responseTypeMenuItem(type: string) {
      return `[data-testid="t--response-type-menu-item"][data-value="${type}"]`;
    },
  };

  public switchToResponseTab(): void {
    cy.get(this.locators.responseTab).click({ force: true });
  }

  public openResponseTypeMenu() {
    this.switchToResponseTab();
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

  public validateTypeInMenu(type: string, assertion: string): void {
    this.switchToResponseTab();
    this.openResponseTypeMenu();
    cy.get(this.locators.responseTypeMenuItem(type)).should(assertion);
    this.closeResponseTypeMenu();
  }

  public validateResponseStatus(status: string): void {
    this.switchToResponseTab();
    cy.get(this.locators.responseStatusInfo).trigger("mouseover");
    cy.get(this.locators.responseStatusInfoTooltip).should(
      "include.text",
      status,
    );
  }

  public validateRecordCount({
    count,
    operator = "eq",
  }: ValidationParams): void {
    cy.get(this.locators.responseRecordCount)
      .invoke("text")
      .then((text) => {
        const extractedCount = parseInt(text.match(/\d+/)?.[0] || "0", 10);

        switch (operator) {
          case "eq":
            expect(extractedCount).to.equal(count);
            break;
          case "gt":
            expect(extractedCount).to.be.greaterThan(count);
            break;
          case "gte":
            expect(extractedCount).to.be.at.least(count);
            break;
          case "lt":
            expect(extractedCount).to.be.lessThan(count);
            break;
          case "lte":
            expect(extractedCount).to.be.at.most(count);
            break;
          default:
            throw new Error(`Invalid comparison operator: ${operator}`);
        }
      });
  }
}

export { Response };
