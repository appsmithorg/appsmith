import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { selectURLSlugs } from "selectors/editorSelectors";
import store from "store";
import { getUpdatedRoute, isURLDeprecated } from "utils/helpers";
import { setMockApplication, setMockPageList } from "./mockData";

describe("URL slug names", () => {
  beforeEach(async () => {
    setMockApplication();
    setMockPageList();
    store.dispatch({
      type: ReduxActionTypes.SWITCH_CURRENT_PAGE_ID,
      payload: "605c435a91dea93f0eaf91ba",
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
});
