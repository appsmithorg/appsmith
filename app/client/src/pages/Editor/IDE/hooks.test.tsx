import { renderHook } from "@testing-library/react-hooks";
import { hookWrapper } from "test/testUtils";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { PageFactory } from "test/factories/PageFactory";
import { useGetPageFocusUrl } from "./hooks";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createEditorFocusInfo } from "../../../ce/navigation/FocusStrategy/AppIDEFocusStrategy";

const mockUseGitCurrentBranch = jest.fn<string | null, []>(() => null);

jest.mock("../gitSync/hooks/modHooks", () => ({
  useGitCurrentBranch: () => mockUseGitCurrentBranch(),
}));

describe("useGetPageFocusUrl", () => {
  const pages = PageFactory.buildList(4);

  pages[0].isDefault = true;
  const page1FocusHistory = createEditorFocusInfo(pages[0].pageId, null);
  const page2FocusHistory = createEditorFocusInfo(pages[1].pageId, null);
  const page3FocusHistory = createEditorFocusInfo(pages[2].pageId, null);

  const focusHistory = {
    [page1FocusHistory.key]: {
      entityInfo: page1FocusHistory.entityInfo,
      state: {
        SelectedEntity: "jsObjects/js_id",
      },
    },
    [page2FocusHistory.key]: {
      entityInfo: page2FocusHistory.entityInfo,
      state: {
        SelectedEntity: "widgets/widgetId",
      },
    },
    [page3FocusHistory.key]: {
      entityInfo: page3FocusHistory.entityInfo,
      state: {
        SelectedEntity: "queries/query_id",
      },
    },
  };

  const state = getIDETestState({
    pages,
    focusHistory,
  });
  const wrapper = hookWrapper({ initialState: state });

  it("works for JS focus history", () => {
    mockUseGitCurrentBranch.mockReturnValue(null);
    const { result } = renderHook(() => useGetPageFocusUrl(pages[0].pageId), {
      wrapper,
    });

    expect(result.current).toEqual(
      `/app/application/page-${pages[0].pageId}/edit/jsObjects/js_id`,
    );
  });

  it("works for UI focus history", () => {
    const { result } = renderHook(() => useGetPageFocusUrl(pages[1].pageId), {
      wrapper,
    });

    expect(result.current).toEqual(
      `/app/application/page-${pages[1].pageId}/edit/widgets/widgetId`,
    );
  });

  it("works for Query focus history", () => {
    const { result } = renderHook(() => useGetPageFocusUrl(pages[2].pageId), {
      wrapper,
    });

    expect(result.current).toEqual(
      `/app/application/page-${pages[2].pageId}/edit/queries/query_id`,
    );
  });

  it("returns builder url when no focus history exists", () => {
    const { result } = renderHook(() => useGetPageFocusUrl(pages[3].pageId), {
      wrapper,
    });

    expect(result.current).toEqual(
      `/app/application/page-${pages[3].pageId}/edit`,
    );
  });

  it("returns correct state when branches exist", () => {
    const branch = "featureBranch";

    mockUseGitCurrentBranch.mockReturnValue(branch);
    const page1FocusHistoryWithBranch = createEditorFocusInfo(
      pages[0].pageId,
      branch,
    );

    const state = getIDETestState({
      pages,
      focusHistory: {
        ...focusHistory,
        [page1FocusHistoryWithBranch.key]: {
          entityInfo: page1FocusHistoryWithBranch.entityInfo,
          state: {
            SelectedEntity: "widgets/widgetId2",
          },
        },
      },
      branch,
    });

    const wrapperWithBranch = hookWrapper({ initialState: state });

    const { result } = renderHook(() => useGetPageFocusUrl(pages[0].pageId), {
      wrapper: wrapperWithBranch,
    });

    expect(result.current).toEqual(
      `/app/application/page-${pages[0].pageId}/edit/widgets/widgetId2`,
    );
  });
});
