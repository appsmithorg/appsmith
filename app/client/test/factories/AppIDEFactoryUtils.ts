import store from "store";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import type { AppState } from "@appsmith/reducers";
import MockPluginsState from "test/factories/MockPluginsState";
import type { Page } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { IDETabs } from "reducers/uiReducers/ideReducer";
import { IDETabsDefaultValue } from "reducers/uiReducers/ideReducer";
import type { JSCollection } from "entities/JSCollection";

interface IDEStateArgs {
  ideView?: EditorViewMode;
  pages?: Page[];
  actions?: Action[];
  js?: JSCollection[];
  tabs?: IDETabs;
}

export const getIDETestState = ({
  actions = [],
  ideView = EditorViewMode.FullScreen,
  js = [],
  pages = [],
  tabs = IDETabsDefaultValue,
}: IDEStateArgs): AppState => {
  const initialState = store.getState();

  const pageList = {
    pages,
    isGeneratingTemplatePage: false,
    applicationId: "655716e035e2c9432e4bd94b",
    currentPageId: pages[0]?.pageId,
    defaultPageId: pages[0]?.pageId,
    loading: {},
  };

  const actionData = actions.map((a) => ({ isLoading: false, config: a }));

  const jsData = js.map((a) => ({ isLoading: false, config: a }));

  return {
    ...initialState,
    entities: {
      ...initialState.entities,
      plugins: MockPluginsState,
      pageList: pageList,
      actions: actionData,
      jsActions: jsData,
    },
    ui: {
      ...initialState.ui,
      ide: {
        ...initialState.ui.ide,
        view: ideView,
        tabs,
      },
      editor: {
        ...initialState.ui.editor,
        initialized: true,
      },
    },
  };
};
