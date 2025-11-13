import type { DefaultRootState } from "react-redux";
import { getLayoutOnUnloadActions } from "selectors/editorSelectors";

describe("getLayoutOnUnloadActions", () => {
  it("should filter actions by current page ID", () => {
    const state = {
      entities: {
        pageList: { currentPageId: "page1" },
        jsActions: [
          {
            isLoading: false,
            config: {
              id: "collection1",
              pageId: "page1",
              actions: [
                {
                  id: "action1",
                  pageId: "page1",
                  runBehaviour: "ON_PAGE_UNLOAD",
                  name: "myFun1",
                  fullyQualifiedName: "JSObject1.myFun1",
                  collectionId: "collection1",
                },
                {
                  id: "action3",
                  pageId: "page1",
                  runBehaviour: "ON_PAGE_LOAD",
                  name: "myFun2",
                  fullyQualifiedName: "JSObject1.myFun2",
                  collectionId: "collection1",
                },
              ],
            },
          },
          {
            isLoading: false,
            config: {
              id: "collection2",
              pageId: "page2",
              actions: [
                {
                  id: "action2",
                  pageId: "page2",
                  runBehaviour: "ON_PAGE_UNLOAD",
                  name: "myFun1",
                  fullyQualifiedName: "JSObject2.myFun1",
                  collectionId: "collection2",
                },
              ],
            },
          },
        ],
      },
    };

    const result = getLayoutOnUnloadActions(
      state as unknown as DefaultRootState,
    );

    expect(result).toEqual([
      {
        id: "action1",
        pageId: "page1",
        runBehaviour: "ON_PAGE_UNLOAD",
        name: "myFun1",
        fullyQualifiedName: "JSObject1.myFun1",
        collectionId: "collection1",
      },
    ]);
  });
});
