import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "Select widget filterText",
  { tags: ["@tag.All", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("defaultFilterText");
    });

    it("1. default value should be an empty string", () => {
      agHelper.AssertContains("string");
    });
  },
);
