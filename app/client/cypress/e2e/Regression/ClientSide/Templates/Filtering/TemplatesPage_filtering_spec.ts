import {
  homePage,
  agHelper,
  templates,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Templates page filtering",
  { tags: ["@tag.excludeForAirgap", "@tag.Templates"] },
  () => {
    const FUNCTIONS_FILTER = ["Operations", "Customer Support"];
    const NAME_FILTER = "order";
    let TEMPLATES_COUNT: number;

    before(() => {
      cy.visit("/templates", { timeout: 60000 });
      templates
        .GetTemplatesCardsList()
        .then((cards) => (TEMPLATES_COUNT = cards.length));
    });

    it("1. should filter templates by name", () => {
      templates.RefreshTemplatesPage(true);
      templates.FilterTemplatesByName(NAME_FILTER);

      templates
        .GetTemplatesCardsList()
        .should((cards) =>
          expect(cards.length).to.be.lessThan(TEMPLATES_COUNT),
        );
    });

    it("2. should filter templates by functions", () => {
      templates.RefreshTemplatesPage(true);
      templates.FilterByFirst2Categories();

      templates
        .GetTemplatesCardsList()
        .should((cards) =>
          expect(cards.length).to.be.lessThan(TEMPLATES_COUNT),
        );
    });

    it("3. should reset filters when coming back from template detailed view", () => {
      templates.RefreshTemplatesPage(false);
      templates.FilterTemplatesByName(NAME_FILTER);

      templates.GetTemplatesCardsList().then((cards) => {
        const filteredCardsCount = cards.length;
        expect(filteredCardsCount).to.be.lessThan(TEMPLATES_COUNT);

        agHelper.GetNClick(templates.locators._templateCard);
        agHelper.GetNClick(templates.locators._templateViewGoBack);
        agHelper.AssertElementLength(
          templates.locators._templateCard,
          filteredCardsCount,
        );
      });
    });
  },
);
