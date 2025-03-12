import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import { propPane, table } from "../../../../../support/Objects/ObjectsCore";

const DEFAULT_ROW_HEIGHT = 40;

describe(
  "Table Widget Dynamic Row Height",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before(() => {
      featureFlagIntercept({
        release_tablev2_infinitescroll_enabled: true,
      });

      // Set up a table with test data
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 300, y: 300 });

      // Create test data with varying content lengths
      const testData = [
        {
          id: 1,
          name: "Short text",
          description: "This is a short description",
        },
        {
          id: 2,
          name: "Medium length text",
          description:
            "This description is a bit longer and might wrap to the next line depending on column width",
        },
        {
          id: 3,
          name: "Very long text content",
          description:
            "This is a very long description that will definitely wrap to multiple lines when cell wrapping is enabled. It contains enough text to ensure that the row height will need to expand significantly to accommodate all the content properly.",
        },
      ];

      // Set the table data
      propPane.EnterJSContext("Table data", JSON.stringify(testData));

      // Turn on Infinite Scroll
      propPane.TogglePropertyState("Infinite scroll", "On");
    });

    it("1. Should maintain fixed height when cell wrapping is disabled and no HTML cells are present", () => {
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            expect(Math.ceil(height!)).to.equal(DEFAULT_ROW_HEIGHT);
          });
      });
    });

    it("2. Should increase row height when cell wrapping is enabled", () => {
      // turn on cell wrapping
      table.EditColumn("description", "v2");
      propPane.TogglePropertyState("Cell wrapping", "On");
      propPane.NavigateBackToPropertyPane();

      // get the height of the row with the longest text
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            expect(Math.ceil(height!)).to.be.greaterThan(DEFAULT_ROW_HEIGHT);
          });
      });
    });

    it("3. Should update row heights when content changes", () => {
      // check and store current row height in variable
      let currentRowHeight = 0;
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            currentRowHeight = Math.ceil(height!);
          });
      });

      // updated table data with extermely long text
      const updatedTestData = [
        {
          id: 4,
          name: "Short text",
          description: "This is a short description",
        },
        {
          id: 5,
          name: "Extremely long text",
          description:
            "This is an extremely long description that will definitely wrap to multiple lines when cell wrapping is enabled. It contains enough text to ensure that the row height will need to expand significantly to accommodate all the content properly. We're adding even more text here to make sure the row expands further than before. The height measurement should reflect this change in content length appropriately. Additionally, this text continues with more detailed information about how the wrapping behavior works in practice. When dealing with variable height rows, it's important to validate that the table can handle content of any length gracefully. This extra text helps us verify that the row height calculations are working correctly even with very long content that spans multiple lines. The table should automatically adjust the row height to fit all of this content while maintaining proper scrolling and layout behavior. We want to ensure there are no visual glitches or truncation issues when displaying such lengthy content.",
        },
      ];

      // update the table data
      propPane.EnterJSContext("Table data", JSON.stringify(updatedTestData));

      // Find the tallest row in the table
      let maxHeight = 0;
      cy.get(".t--widget-tablewidgetv2 .tbody .tr")
        .each(($row, index) => {
          cy.wrap($row)
            .invoke("outerHeight")
            .then((height) => {
              if (height! > maxHeight) {
                maxHeight = height!;
              }
            });
        })
        .then(() => {
          expect(maxHeight).to.be.greaterThan(currentRowHeight);
        });
    });

    it("4. Should revert to fixed height when cell wrapping is disabled", () => {
      // turn off cell wrapping
      table.EditColumn("description", "v2");
      propPane.TogglePropertyState("Cell wrapping", "Off");
      propPane.NavigateBackToPropertyPane();

      // get the height of the row with the longest text
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            expect(Math.ceil(height!)).to.equal(DEFAULT_ROW_HEIGHT);
          });
      });
    });

    it("5. Should handle HTML content in cells with proper height adjustment", () => {
      // Create test data with HTML content
      const htmlTestData = [
        {
          id: 6,
          name: "HTML content",
          description:
            "<div>This is a <strong>formatted</strong> description with <br/><br/>multiple line breaks<br/>and formatting</div>",
        },
      ];

      // Update the table data
      propPane.EnterJSContext("Table data", JSON.stringify(htmlTestData));

      // update the column type to html
      table.EditColumn("description", "v2");
      propPane.SelectPropertiesDropDown("Column type", "HTML");
      propPane.NavigateBackToPropertyPane();

      // get the height of the row with the longest text
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").each(($row) => {
        cy.wrap($row)
          .invoke("outerHeight")
          .then((height) => {
            expect(Math.ceil(height!)).to.be.greaterThan(DEFAULT_ROW_HEIGHT);
          });
      });
    });
  },
);
