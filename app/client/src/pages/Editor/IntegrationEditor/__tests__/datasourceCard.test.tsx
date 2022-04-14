import React from "react";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import store from "store";
import { render } from "test/testUtils";
import DatasourceCard from "../DatasourceCard";
import { mockDatasources, mockPlugins } from "../mockData";

describe("Tasks", () => {
  it("Checks to see if generate page button is hidden for unsupported plugins", () => {
    store.dispatch({
      type: ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
      payload: mockPlugins,
    });
    const generatePageComponent = render(
      <DatasourceCard
        datasource={mockDatasources[0]}
        plugin={mockPlugins[0]}
      />,
    );
    expect(
      generatePageComponent.container.querySelector(".t--generate-template"),
    ).toBeDefined();

    const NoGeneratePageComponent = render(
      <DatasourceCard
        datasource={mockDatasources[1]}
        plugin={mockPlugins[1]}
      />,
    );
    expect(
      NoGeneratePageComponent.container.querySelector(".t--generate-template"),
    ).toBeNull();
  });
});
