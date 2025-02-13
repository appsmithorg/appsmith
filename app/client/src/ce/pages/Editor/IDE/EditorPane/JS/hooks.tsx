import { lazy, Suspense, useCallback, useMemo } from "react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewJSCollection } from "actions/jsPaneActions";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { GroupedAddOperations } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import type { UseRoutes } from "IDE/Interfaces/UseRoutes";
import { ADD_PATH } from "ee/constants/routes/appRoutes";
import history from "utils/history";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useModuleOptions } from "ee/utils/moduleInstanceHelpers";
import { getJSUrl } from "ee/pages/Editor/IDE/EditorPane/JS/utils/getJSUrl";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { setListViewActiveState } from "actions/ideActions";
import { retryPromise } from "utils/AppsmithUtils";
import Skeleton from "widgets/Skeleton";

export const useJSAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const ideViewMode = useSelector(getIDEViewMode);

  const openAddJS = useCallback(() => {
    if (jsModuleCreationOptions.length === 0) {
      dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
    } else {
      if (currentEntityInfo.entity === FocusEntity.JS_OBJECT_ADD) {
        if (ideViewMode === EditorViewMode.SplitScreen) {
          dispatch(setListViewActiveState(false));
        }

        return;
      }

      const url = getJSUrl(currentEntityInfo, true);

      history.push(url);
    }
  }, [
    jsModuleCreationOptions,
    pageId,
    dispatch,
    currentEntityInfo,
    ideViewMode,
  ]);

  const closeAddJS = useCallback(() => {
    const url = getJSUrl(currentEntityInfo, false);

    history.push(url);
  }, [currentEntityInfo]);

  return { openAddJS, closeAddJS };
};

export const useIsJSAddLoading = () => {
  const moduleCreationOptions = useModuleOptions();
  const jsModuleCreationOptions = moduleCreationOptions.filter(
    (opt) => opt.focusEntityType === FocusEntity.JS_MODULE_INSTANCE,
  );
  const { isCreating } = useSelector((state) => state.ui.jsPane);

  if (jsModuleCreationOptions.length === 0) {
    return isCreating;
  }

  return false;
};

export const useGroupedAddJsOperations = (): GroupedAddOperations => {
  return [
    {
      className: "t--blank-js",
      operations: [
        {
          title: createMessage(EDITOR_PANE_TEXTS.js_blank_object_item),
          desc: "",
          icon: JsFileIconV2(16, 16),
          kind: SEARCH_ITEM_TYPES.actionOperation,
          action: (pageId) => createNewJSCollection(pageId, "ENTITY_EXPLORER"),
        },
      ],
    },
  ];
};

const AddJS = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "AddJS" */ "pages/Editor/IDE/EditorPane/JS/Add"
      ),
  ),
);
const JSEditor = lazy(async () =>
  retryPromise(
    async () =>
      import(/* webpackChunkName: "JSEditor" */ "pages/Editor/JSEditor"),
  ),
);

const JSEmpty = lazy(async () =>
  retryPromise(
    async () =>
      import(
        /* webpackChunkName: "JSEmpty" */ "pages/Editor/JSEditor/JSBlankState"
      ),
  ),
);

export const useJSEditorRoutes = (path: string): UseRoutes => {
  return useMemo(
    () => [
      {
        exact: true,
        key: "AddJS",
        component: (args) => (
          <Suspense fallback={<Skeleton />}>
            <AddJS {...args} />
          </Suspense>
        ),
        path: [`${path}${ADD_PATH}`, `${path}/:baseCollectionId${ADD_PATH}`],
      },
      {
        exact: true,
        key: "JSEditor",
        component: (args) => (
          <Suspense fallback={<Skeleton />}>
            <JSEditor {...args} />
          </Suspense>
        ),
        path: [path + "/:baseCollectionId"],
      },
      {
        key: "JSEmpty",
        component: (args) => (
          <Suspense fallback={<Skeleton />}>
            <JSEmpty {...args} />
          </Suspense>
        ),
        exact: true,
        path: [path],
      },
    ],
    [path],
  );
};
