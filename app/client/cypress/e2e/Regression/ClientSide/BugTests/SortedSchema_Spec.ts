import {
  assertHelper,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";

describe("Bug 29059 - Datasource structure schema should be sorted", () => {
  it("1. Postgres schema should be in a sorted order", () => {
    dataSources.CreateDataSource("Postgres");
    assertHelper
      .WaitForNetworkCall(`@getDatasourceStructure`)
      .then((response) => {
        const tables: { name: string }[] = response?.body.data?.tables || [];
        const isCorrectlyOrdered = tables.every((table, index, array) => {
          if (index === 0) {
            return true; // The first element is always considered sorted
          } else {
            // Compare current and previous elements in a case-insensitive manner
            return (
              table.name.localeCompare(array[index - 1].name, undefined, {
                sensitivity: "base",
              }) >= 0
            );
          }
        });
        expect(isCorrectlyOrdered).to.equal(true);
      });
  });
  it("2. Mysql schema should be in a sorted order", () => {
    dataSources.CreateDataSource("MySql");
    assertHelper
      .WaitForNetworkCall(`@getDatasourceStructure`)
      .then((response) => {
        const tables: { name: string }[] = response?.body.data?.tables || [];
        const isCorrectlyOrdered = tables.every((table, index, array) => {
          if (index === 0) {
            return true; // The first element is always considered sorted
          } else {
            // Compare current and previous elements in a case-insensitive manner
            return (
              table.name.localeCompare(array[index - 1].name, undefined, {
                sensitivity: "base",
              }) >= 0
            );
          }
        });
        expect(isCorrectlyOrdered).to.equal(true);
      });
  });
});
