import React from "react";
import { ApplicationVersion } from "actions/applicationActions";
import {
  builderURL,
  getRouteBuilderParams,
  updateURLFactory,
} from "RouteBuilder";
import {
  Page,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getCurrentPageId,
  getPageById,
  selectURLSlugs,
} from "selectors/editorSelectors";
import store from "store";
import { render } from "test/testUtils";
import { getUpdatedRoute, isURLDeprecated } from "utils/helpers";
import {
  fetchApplicationMockResponse,
  setMockApplication,
  setMockPageList,
  updatedApplicationPayload,
  updatedPagePayload,
} from "./mockData";
import ManualUpgrades from "pages/Editor/BottomBar/ManualUpgrades";
import { updateCurrentPage } from "actions/pageActions";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { getPageURL } from "utils/AppsmithUtils";
import { APP_MODE } from "entities/App";
import { AppState } from "reducers";

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
    const state = store.getState() as AppState;
    const { applicationSlug, pageSlug } = selectURLSlugs(state);
    expect(applicationSlug).toBe("my-application");
    expect(pageSlug).toBe("page-1");
  });

  it("checks the update slug in URL method", () => {
    const newAppSlug = "modified-app-slug";
    const newPageSlug = "modified-page-slug";
    const pathname = "/app/my-app/pages-605c435a91dea93f0eaf91ba";
    const url = getUpdatedRoute(pathname, {
      applicationSlug: newAppSlug,
      pageSlug: newPageSlug,
    });
    expect(url).toBe(
      `/app/${newAppSlug}/${newPageSlug}-605c435a91dea93f0eaf91ba`,
    );
  });

  it("checks the isDeprecatedURL method", () => {
    const pathname1 =
      "/applications/605c435a91dea93f0eaf91ba/pages/605c435a91dea93f0eaf91ba/edit";
    const pathname2 =
      "/applications/605c435a91dea93f0eaf91ba/pages/605c435a91dea93f0eaf91ba";
    expect(isURLDeprecated(pathname1)).toBe(true);
    expect(isURLDeprecated(pathname2)).toBe(true);

    const pathname3 = "/app/apSlug/pages-605c435a91dea93f0eaf91ba";

    expect(isURLDeprecated(pathname3)).toBe(false);
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
    expect(url2).toBe("/app/appSlug/pageSlug-pageId/edit");
    expect(url3).toBe("/applications/appId/pages/pageId/edit");
    expect(url4).toBe("/app/appSlug/pageSlug-pageId/edit");
  });

  it("tests the manual upgrade option", () => {
    store.dispatch({
      type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      payload: {
        ...fetchApplicationMockResponse.data.application,
        applicationVersion: 1,
      },
    });
    const component = render(<ManualUpgrades />);
    expect(component.getByTestId("update-indicator")).toBeDefined();
  });

  it("tests Route builder factory params", () => {
    store.dispatch({
      type: ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE,
      payload: updatedApplicationPayload,
    });
    const { applicationSlug } = getRouteBuilderParams();
    expect(applicationSlug).toBe(updatedApplicationPayload.slug);

    store.dispatch({
      type: ReduxActionTypes.UPDATE_PAGE_SUCCESS,
      payload: updatedPagePayload,
    });

    const { pageSlug: updatedPageSlug } = getRouteBuilderParams();

    expect(updatedPageSlug).toBe("page-1");

    store.dispatch(updateCurrentPage("605c435a91dea93f0eaf91bc", "my-page-2"));
    const { pageSlug } = getRouteBuilderParams();

    expect(pageSlug).toBe("my-page-2");
  });

  it("tests slug URLs utility methods", () => {
    const legacyURL =
      "/applications/605c435a91dea93f0eaf91ba/pages/605c435a91dea93f0eaf91ba/edit";
    const slugURL = "/app/my-application/my-page-605c435a91dea93f0eaf91ba/edit";

    expect(isURLDeprecated(legacyURL)).toBe(true);
    expect(isURLDeprecated(slugURL)).toBe(false);

    expect(
      getUpdatedRoute(slugURL, {
        applicationSlug: "my-app",
        pageSlug: "page",
      }),
    ).toBe("/app/my-app/page-605c435a91dea93f0eaf91ba/edit");
  });

  it("tests getPageUrl utility method", () => {
    const state = store.getState() as AppState;
    const currentApplication = getCurrentApplication(state);
    const currentPageId = getCurrentPageId(state);
    const page = getPageById(currentPageId)(state) as Page;

    const editPageURL = getPageURL(page, APP_MODE.EDIT, currentApplication);
    const viewPageURL = getPageURL(
      page,
      APP_MODE.PUBLISHED,
      currentApplication,
    );

    expect(editPageURL).toBe(
      `/app/${currentApplication?.slug}/${page.slug}-${page.pageId}/edit`,
    );
    expect(viewPageURL).toBe(
      `/app/${currentApplication?.slug}/${page.slug}-${page.pageId}`,
    );
  });
});
