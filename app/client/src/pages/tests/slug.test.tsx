import React from "react";
import { ApplicationVersion } from "actions/applicationActions";
import { builderURL, updateURLFactory } from "RouteBuilder";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { selectURLSlugs } from "selectors/editorSelectors";
import store from "store";
import { render } from "test/testUtils";
import { getUpdatedRoute, isURLDeprecated } from "utils/helpers";
import { setMockApplication, setMockPageList } from "./mockData";
import ManualUpgrades from "pages/Editor/BottomBar/ManualUpgrades";

describe("URL slug names", () => {
  beforeEach(async () => {
    setMockApplication();
    setMockPageList();
    store.dispatch({
      type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
      payload: { id: "605c435a91dea93f0eaf91ba", slug: "page-1" },
    });
  });

  it("verifies right slug names from slugs selector", () => {
    const state = store.getState();
    const { applicationSlug, pageSlug } = selectURLSlugs(state);
    expect(applicationSlug).toBe("my-application");
    expect(pageSlug).toBe("page-1");
  });

  it("checks the update slug in URL method", () => {
    const newAppSlug = "modified-app-slug";
    const newPageSlug = "modified-page-slug";
    const pathname = "/my-app/pages-605c435a91dea93f0eaf91ba";
    const url = getUpdatedRoute(pathname, {
      applicationSlug: newAppSlug,
      pageSlug: newPageSlug,
    });
    expect(url).toBe(`/${newAppSlug}/${newPageSlug}-605c435a91dea93f0eaf91ba`);
  });

  it("checks the isDeprecatedURL method", () => {
    const pathname1 =
      "/applications/605c435a91dea93f0eaf91ba/pages/605c435a91dea93f0eaf91ba/edit";
    const pathname2 =
      "/applications/605c435a91dea93f0eaf91ba/pages/605c435a91dea93f0eaf91ba";
    expect(isURLDeprecated(pathname1)).toBe(true);
    expect(isURLDeprecated(pathname2)).toBe(true);
  });

  it("verifies that the baseURLBuilder uses applicationVersion", () => {
    const params = {
      applicationId: "appId",
      applicationSlug: "appSlug",
      pageId: "pageId",
      pageSlug: "pageSlug",
    };
    updateURLFactory({ applicationVersion: ApplicationVersion.DEFAULT });
    const url1 = builderURL(params);
    updateURLFactory({ applicationVersion: ApplicationVersion.SLUG_URL });
    const url2 = builderURL(params);
    store.dispatch({
      type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      payload: { applicationVersion: ApplicationVersion.DEFAULT },
    });
    const url3 = builderURL(params);
    store.dispatch({
      type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
      payload: { applicationVersion: ApplicationVersion.SLUG_URL },
    });
    const url4 = builderURL(params);
    expect(url1).toBe("/applications/appId/pages/pageId/edit");
    expect(url2).toBe("/appSlug/pageSlug-pageId/edit");
    expect(url3).toBe("/applications/appId/pages/pageId/edit");
    expect(url4).toBe("/appSlug/pageSlug-pageId/edit");
  });

  it("tests the manual upgrade option", () => {
    store.dispatch({
      type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
      payload: { applicationVersion: 1 },
    });
    const component = render(<ManualUpgrades />);
    expect(component.getByTestId("update-indicator")).toBeDefined();
  });
});
