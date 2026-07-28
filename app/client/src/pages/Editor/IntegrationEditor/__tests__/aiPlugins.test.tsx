import React from "react";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import store from "store";
import { render } from "test/testUtils";
import { PluginPackageName } from "entities/Plugin";
import AIPlugins from "../AIPlugins";

const aiPlugins = [
  {
    id: "appsmith-ai-plugin-id",
    name: "Appsmith AI",
    type: "AI",
    packageName: PluginPackageName.APPSMITH_AI,
    iconLocation: "",
  },
  {
    id: "openai-plugin-id",
    name: "OpenAI",
    type: "AI",
    packageName: "openai-plugin",
    iconLocation: "",
  },
];

describe("AIPlugins create-new list", () => {
  it("hides deprecated Appsmith AI but keeps other AI plugins", () => {
    store.dispatch({
      type: ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
      payload: aiPlugins,
    });

    const { container } = render(
      <AIPlugins pageId="pageId" showUnsupportedPluginDialog={() => {}} />,
    );

    // BYOK AI plugins must remain creatable
    expect(
      container.querySelector(".t--createBlankApi-openai-plugin"),
    ).not.toBeNull();
    // The deprecated managed Appsmith AI plugin must not be offered for creation
    expect(
      container.querySelector(
        `.t--createBlankApi-${PluginPackageName.APPSMITH_AI}`,
      ),
    ).toBeNull();
  });
});
