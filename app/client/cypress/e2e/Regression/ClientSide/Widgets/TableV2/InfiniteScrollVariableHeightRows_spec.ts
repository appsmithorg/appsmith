import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import { propPane, table } from "../../../../../support/Objects/ObjectsCore";

const DEFAULT_ROW_HEIGHT = 40;

describe(
  "Table Widget Dynamic Row Height",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before(() => {
      featureFlagIntercept({
        release_table_infinitescroll_enabled: true,
      });

      cy.dragAndDropToCanvas("tablewidgetv2", { x: 300, y: 300 });

      const testData = [
        {
          id: 1.5,
          name: "Very long text content",
          description:
            "This is a very long description that will definitely wrap to multiple lines when cell wrapping is enabled. It contains enough text to ensure that the row height will need to expand significantly to accommodate all the content properly.",
        },
        {
          id: 2,
          name: "Very long text content",
          description:
            "This is a very long description that will definitely wrap to multiple lines when cell wrapping is enabled. It contains enough text to ensure that the row height will need to expand significantly to accommodate all the content properly.",
        },
        {
          id: 3,
          name: "Very long text content",
          description:
            "This is a very long description that will definitely wrap to multiple lines when cell wrapping is enabled. It contains enough text to ensure that the row height will need to expand significantly to accommodate all the content properly.",
        },
        {
          id: 10,
          name: "HTML content",
          description:
            "<div>This is a <strong>formatted</strong> description with <br/><br/>multiple line breaks<br/>and formatting</div>",
        },
      ];

      propPane.EnterJSContext("Table data", JSON.stringify(testData));

      propPane.TogglePropertyState("Server side pagination", "On");
      propPane.TogglePropertyState("Infinite scroll", "On");
    });

    it("1. Should maintain fixed height when cell wrapping is disabled and no HTML cells are present", () => {
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            if (height !== undefined) {
              expect(Math.ceil(height)).to.equal(DEFAULT_ROW_HEIGHT);
            }
          });
      });
    });

    it("2. should change height when cell wrapping is turned on", () => {
      table.EditColumn("description", "v2");
      propPane.TogglePropertyState("Cell wrapping", "On");

      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            if (height !== undefined) {
              expect(Math.ceil(height)).to.be.greaterThan(DEFAULT_ROW_HEIGHT);
            }
          });
      });
    });

    it("3. should change height when cell wrapping is turned off", () => {
      propPane.TogglePropertyState("Cell wrapping", "Off");

      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            if (height !== undefined) {
              expect(Math.ceil(height)).to.equal(DEFAULT_ROW_HEIGHT);
            }
          });
      });

      propPane.NavigateBackToPropertyPane();
    });

    it("4. Should handle HTML content in cells with proper height adjustment", () => {
      table.ChangeColumnType("description", "HTML");

      // Find the tallest row in the table
      let maxHeight = 0;
      cy.get(".t--widget-tablewidgetv2 .tbody .tr")
        .each(($row, index) => {
          cy.wrap($row)
            .invoke("outerHeight")
            .then((height) => {
              if (height !== undefined && height > maxHeight) {
                maxHeight = height;
              }
            });
        })
        .then(() => {
          expect(maxHeight).to.be.at.least(DEFAULT_ROW_HEIGHT);
        });
    });
  },
);
