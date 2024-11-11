import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

const shortName = "shortName";
const longName = "AVeryLongNameThatOverflows";
const alternateName = "AlternateName";
const tooltTipQuery = `.rc-tooltip.ads-v2-tooltip:not(.rc-tooltip-hidden) > .rc-tooltip-content > .rc-tooltip-inner > .ads-v2-text`;
describe(
  "Entity Explorer showing tooltips on long names",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    it("1. Expect tooltip on long names only", function () {
      // create an API with a short name
      cy.CreateAPI(shortName);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      // assert that a tooltip does not show up during hover
      cy.get(`.t--entity-item:contains(${shortName})`).realHover();
      cy.get(tooltTipQuery).should("not.exist");
      // reset the hover
      cy.get("body").realHover({ position: "topLeft" });

      // create another API with a long name
      cy.CreateAPI(longName);

      // assert that a tooltip does show up during hover
      cy.get(`.t--entity-item:contains(${longName})`).realHover();
      cy.get(tooltTipQuery).should("have.text", longName);
      // reset the hover
      cy.get("body").realHover({ position: "topLeft" });

      // rename it and ensure the tooltip does not show again
      ee.RenameEntityFromExplorer(longName, alternateName);
      cy.wait("@saveAction");

      cy.get(`.t--entity-item:contains(${alternateName})`).realHover();
      cy.get(tooltTipQuery).should("not.exist");
    });
  },
);
