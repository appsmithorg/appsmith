import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const apiPage = ObjectsRegistry.ApiPage,
  aghelper = ObjectsRegistry.AggregateHelper;

describe("Validate API Auto generated headers", () => {
  it("1. Check whether auto generated header is set and overidden", () => {
    apiPage.CreateApi("FirstAPI");
    aghelper.EnterValueNValidate(`{{{"key": "balue"}}}`, apiPage._resourceUrl);
  });
});
