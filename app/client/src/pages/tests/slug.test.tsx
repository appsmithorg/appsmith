import React from "react";
import { ApplicationVersion } from "ee/actions/applicationActions";
import { builderURL } from "ee/RouteBuilder";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { selectURLSlugs } from "selectors/editorSelectors";
import store from "store";
import { render } from "test/testUtils";
import {
  getUpdatedRoute,
  isURLDeprecated,
  matchPath_BuilderCustomSlug,
  matchPath_ViewerCustomSlug,
} from "utils/helpers";
import {
  mockApplicationPayload,
  setMockApplication,
  setMockPageList,
  updateMockCurrentPage,
  updatedApplicationPayload,
  updatedPagePayload,
} from "./mockData";
import ManualUpgrades from "components/BottomBar/ManualUpgrades";
import { updateCurrentPage } from "actions/pageActions";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { Button } from "@appsmith/ads";

describe("URL slug names", () => {
  beforeEach(async () => {
    setMockApplication();
    setMockPageList();
    updateMockCurrentPage();
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
    const customSlug = "custom-slug";
    const pathname = "/app/my-app/pages-605c435a91dea93f0eaf91ba";
    const url1 = getUpdatedRoute(pathname, {
      applicationSlug: newAppSlug,
      pageSlug: newPageSlug,
    });

    expect(url1).toBe(
      `/app/${newAppSlug}/${newPageSlug}-605c435a91dea93f0eaf91ba`,
    );
    const url2 = getUpdatedRoute(pathname, {
      applicationSlug: newAppSlug,
      pageSlug: newPageSlug,
      customSlug,
    });

    expect(url2).toBe(`/app/${customSlug}-605c435a91dea93f0eaf91ba`);
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

    const pathname4 = "/app/customSlug-605c435a91dea93f0eaf91ba";

    expect(isURLDeprecated(pathname4)).toBe(false);
  });

  it("verifies that the baseURLBuilder uses applicationVersion", () => {
    const baseApplicationId = "a0123456789abcdef0000000";
    const basePageId = "b0123456789abcdef0000000";
    const params = {
      baseApplicationId,
      applicationSlug: "appSlug",
      basePageId,
      pageSlug: "pageSlug",
      customSlug: "customSlug",
    };

    urlBuilder.updateURLParams(
      {
        applicationVersion: ApplicationVersion.DEFAULT,
        applicationSlug: params.applicationSlug,
        baseApplicationId: params.baseApplicationId,
      },
      [
        {
          basePageId: params.basePageId,
          pageSlug: params.pageSlug,
        },
      ],
    );
    const url1 = builderURL({ basePageId: params.basePageId });

    urlBuilder.updateURLParams({
      applicationVersion: ApplicationVersion.SLUG_URL,
    });
    const url2 = builderURL({ basePageId: params.basePageId });

    store.dispatch({
      type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
      payload: { applicationVersion: ApplicationVersion.DEFAULT },
    });
    const url3 = builderURL({ basePageId: params.basePageId });

    store.dispatch({
      type: ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
      payload: { applicationVersion: ApplicationVersion.SLUG_URL },
    });
    const url4 = builderURL({ basePageId: params.basePageId });

    expect(url1).toBe(
      `/applications/${baseApplicationId}/pages/${basePageId}/edit`,
    );
    expect(url2).toBe(`/app/appSlug/pageSlug-${basePageId}/edit`);
    expect(url3).toBe(
      `/applications/${baseApplicationId}/pages/${basePageId}/edit`,
    );
    expect(url4).toBe(`/app/appSlug/pageSlug-${basePageId}/edit`);
  });

  it("tests the manual upgrade option", () => {
    store.dispatch({
      type: ReduxActionTypes.FETCH_APPLICATION_SUCCESS,
      payload: {
        ...mockApplicationPayload,
        applicationVersion: 1,
      },
    });
    const component = render(
      <ManualUpgrades showTooltip>
        <Button
          className="t--upgrade"
          isIconButton
          kind="tertiary"
          size="md"
          startIcon="upgrade"
        />
      </ManualUpgrades>,
    );

    expect(component.getByTestId("update-indicator")).toBeDefined();
  });

  it("tests Route builder factory params", () => {
    store.dispatch({
      type: ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE,
      payload: updatedApplicationPayload,
    });
    store.dispatch({
      type: ReduxActionTypes.UPDATE_PAGE_SUCCESS,
      payload: updatedPagePayload,
    });
    const { applicationSlug, pageSlug: updatedPageSlug } =
      urlBuilder.getURLParams(updatedPagePayload.id);

    expect(applicationSlug).toBe(updatedApplicationPayload.slug);

    expect(updatedPageSlug).toBe(updatedPagePayload.slug);

    store.dispatch(updateCurrentPage("605c435a91dea93f0eaf91bc", "my-page-2"));
    const { pageSlug } = urlBuilder.getURLParams("605c435a91dea93f0eaf91bc");

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

  it("getUpdatedRoute - handles pattern match overlap with slug url and custom slug url", () => {
    // this path will match with VIEWER_PATH and BUILDER_CUSTOM_PATH
    const customSlug_pathname =
      "/app/custom-63c63d944ae4345e31af12a7/edit/saas/google-sheets-plugin/api/63c63d984ae4345e31af12e5";

    // verify path match overlap
    const matchBuilderCustomPath =
      matchPath_BuilderCustomSlug(customSlug_pathname);
    const matchViewerSlugPath = matchPath_ViewerCustomSlug(customSlug_pathname);

    expect(matchViewerSlugPath).not.toBeNull();
    expect(matchBuilderCustomPath).not.toBeNull();

    // verify proper url is returned regarless of match overlap
    expect(
      getUpdatedRoute(customSlug_pathname, {
        applicationSlug: "gsheetreleasetesting-copy",
        customSlug: "custom",
        basePageId: "63c63d944ae4345e31af12a7",
        pageSlug: "basicpagination",
      }),
    ).toBe(customSlug_pathname);
  });
});
