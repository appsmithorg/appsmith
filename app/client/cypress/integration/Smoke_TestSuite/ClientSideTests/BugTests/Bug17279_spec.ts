import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  apiPage = ObjectsRegistry.ApiPage;

const apiWebhookUrl =
  "https://webhook.site/0e5cefd3-da4c-4ada-950a-87fb3a3cd957";

describe("Abort Action Execution", function() {
  it("1. Bug #14006, #16093 - Cancel Request button should abort API action execution", function() {
    apiPage.CreateAndFillApi(apiWebhookUrl, "WebhookAPI", 0);
    apiPage.RunAPI(true);
    apiPage.SwitchToResponseTab(apiPage._responseTabHeader);
    agHelper.AssertContains(
      `"X-Token-Id": "0e5cefd3-da4c-4ada-950a-87fb3a3cd957"`,
    );
    agHelper.ActionContextMenuWithInPane("Delete", "Are you sure?");
  });
});
