import { renderHook } from "@testing-library/react-hooks";
import { hookWrapper } from "test/testUtils";
import { getIDETestState } from "test/factories/AppIDEFactoryUtils";
import { PageFactory } from "test/factories/PageFactory";
import { useGetPageFocusUrl } from "./hooks";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { createEditorFocusInfo } from "../../../ce/navigation/FocusStrategy/AppIDEFocusStrategy";

describe("useGetPageFocusUrl", () => {
  const pages = PageFactory.buildList(4);
  pages[0].isDefault = true;
  const page1FocusHistory = createEditorFocusInfo(pages[0].pageId);
  const page2FocusHistory = createEditorFocusInfo(pages[1].pageId);
  const page3FocusHistory = createEditorFocusInfo(pages[2].pageId);

  const focusHistory = {
    [page1FocusHistory.key]: {
      entityInfo: page1FocusHistory.entityInfo,
      state: { SelectedSegment: EditorEntityTab.JS },
    },
    [page2FocusHistory.key]: {
      entityInfo: page2FocusHistory.entityInfo,
      state: { SelectedSegment: EditorEntityTab.UI },
    },
    [page3FocusHistory.key]: {
      entityInfo: page3FocusHistory.entityInfo,
      state: { SelectedSegment: EditorEntityTab.QUERIES },
    },
  };

  const state = getIDETestState({
    pages,
    focusHistory,
  });
  const wrapper = hookWrapper({ initialState: state });
  it("works for JS focus history", () => {
    const { result } = renderHook(() => useGetPageFocusUrl(pages[0].pageId), {
      wrapper,
    });

    expect(result.current).toEqual(
      "/app/application/page-page_id_1/edit/jsObjects",
    );
  });

  it("works for UI focus history", () => {
    const { result } = renderHook(() => useGetPageFocusUrl(pages[1].pageId), {
      wrapper,
    });

    expect(result.current).toEqual(
      "/app/application/page-page_id_2/edit/widgets",
    );
  });

  it("works for Query focus history", () => {
    const { result } = renderHook(() => useGetPageFocusUrl(pages[2].pageId), {
      wrapper,
    });

    expect(result.current).toEqual(
      "/app/application/page-page_id_3/edit/queries",
    );
  });

  it("returns builder url when no focus history exists", () => {
    const { result } = renderHook(() => useGetPageFocusUrl(pages[3].pageId), {
      wrapper,
    });

    expect(result.current).toEqual("/app/application/page-page_id_4/edit");
  });

  it("returns correct state when branches exist", () => {
    const branch = "featureBranch";
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
          state: { SelectedSegment: EditorEntityTab.UI },
        },
      },
      branch,
    });

    const wrapperWithBranch = hookWrapper({ initialState: state });

    const { result } = renderHook(() => useGetPageFocusUrl(pages[0].pageId), {
      wrapper: wrapperWithBranch,
    });

    expect(result.current).toEqual(
      "/app/application/page-page_id_1/edit/widgets",
    );
  });
});
