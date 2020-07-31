import {
  useEffect,
  MutableRefObject,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import {
  ENTITY_TYPE,
  DataTreeEntity,
  DataTree,
  DataTreeAction,
} from "entities/DataTree/dataTreeFactory";
import { compact } from "lodash";
import { Datasource } from "api/DatasourcesApi";
import { debounce } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { evaluateDataTreeWithFunctions } from "selectors/dataTreeSelectors";
import { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import log from "loglevel";

const findWidgets = (widgets: WidgetProps, keyword: string) => {
  if (widgets.children) {
    widgets.children = compact(
      widgets.children.map((widget: WidgetProps) =>
        findWidgets(widget, keyword),
      ),
    );
    return widgets.children.length > 0 ? widgets : undefined;
  }
  if (widgets.widgetName.toLowerCase().indexOf(keyword) > -1) return widgets;
};

const findActions = (actions: Array<DataTreeAction>, keyword: string) => {
  return actions.filter(
    (action: DataTreeAction) => action.name.toLowerCase().indexOf(keyword) > -1,
  );
};

const findDataSources = (dataSources: Datasource[], keyword: string) => {
  return dataSources.filter(
    (dataSource: Datasource) =>
      dataSource.name.toLowerCase().indexOf(keyword) > -1,
  );
};

export const useFilteredEntities = (
  ref: MutableRefObject<HTMLInputElement | null>,
) => {
  const start = performance.now();
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);

  const dataTree: DataTree = useSelector(evaluateDataTreeWithFunctions);
  const pages = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });

  const currentPageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });

  const dataSources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });

  const currentPageWidgetEntities = useMemo(() => {
    const canvasWidgets: { [id: string]: any } = {};
    Object.values(dataTree).forEach(
      (
        entity: DataTreeEntity & {
          ENTITY_TYPE?: ENTITY_TYPE;
          widgetId?: string;
        },
      ) => {
        if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET && entity.widgetId) {
          canvasWidgets[entity.widgetId] = entity;
        }
      },
    );

    const widgetTree = CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets,
    });
    widgetTree.pageId = currentPageId;

    return searchKeyword !== null
      ? findWidgets(widgetTree, searchKeyword.toLowerCase())
      : widgetTree;
  }, [searchKeyword, dataTree, currentPageId]);

  const allPageDSLs = useSelector((state: AppState) => state.ui.pageDSLs);
  const otherPagesWidgetEntities = useMemo(() => {
    return Object.keys(allPageDSLs)
      .filter((pageId: string) => pageId !== currentPageId)
      .map((pageId: string) => {
        const tree = allPageDSLs[pageId];
        tree.pageId = pageId;

        return searchKeyword !== null
          ? findWidgets(tree, searchKeyword.toLowerCase())
          : tree;
      });
  }, [searchKeyword, allPageDSLs, currentPageId]);

  const actions = useMemo(
    () =>
      Object.values(dataTree).filter(
        (entity: DataTreeEntity & { ENTITY_TYPE?: ENTITY_TYPE }) =>
          entity.ENTITY_TYPE === ENTITY_TYPE.ACTION,
      ),
    [dataTree],
  );

  const allAppActions = useSelector(
    (state: AppState) => state.entities.actions,
  );

  const actionEntities = useMemo(() => {
    const otherPageDataTreeActions: DataTreeAction[] = allAppActions
      .filter((action: ActionData) => action.config.pageId !== currentPageId)
      .map((action: ActionData) => ({
        isLoading: action.isLoading,
        actionId: action.config.id,
        pluginType: action.config.pluginType,
        name: action.config.name,
        pageId: action.config.pageId,
        run: {},
        dynamicBindingPathList: action.config.dynamicBindingPathList,
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
        data: action.data || {},
        config: {
          paginationType: action.config.actionConfiguration.paginationType,
          timeoutInMillisecond:
            action.config.actionConfiguration.timeoutInMillisecond,
          httpMethod: action.config.actionConfiguration.httpMethod,
        },
      }));
    const currentPageActions = actions.map(action => ({
      ...action,
      pageId: currentPageId,
    }));
    const allActions = [...currentPageActions, ...otherPageDataTreeActions];
    return searchKeyword !== null
      ? findActions(allActions as DataTreeAction[], searchKeyword.toLowerCase())
      : allActions;
  }, [searchKeyword, actions, allAppActions, currentPageId]);

  const datasourceEntities = useMemo(
    () =>
      searchKeyword !== null
        ? findDataSources(dataSources, searchKeyword.toLowerCase())
        : dataSources,
    [searchKeyword, dataSources],
  );

  const search = debounce((e: any) => {
    const keyword = e.target.value;
    if (keyword.trim().length > 0) {
      setSearchKeyword(keyword);
    } else {
      setSearchKeyword(null);
    }
  }, 300);

  const event = new Event("cleared");
  useEffect(() => {
    const el: HTMLInputElement | null = ref.current;

    el?.addEventListener("keydown", search);
    el?.addEventListener("cleared", search);
    return () => {
      el?.removeEventListener("keydown", search);
      el?.removeEventListener("cleared", search);
    };
  }, [ref, search]);

  const clearSearch = useCallback(() => {
    const el: HTMLInputElement | null = ref.current;
    if (el && el.value.trim().length > 0) {
      el.value = "";
      el?.dispatchEvent(event);
    }
  }, [ref, event]);
  const allWidgetEntities = useMemo(
    () => compact([currentPageWidgetEntities, ...otherPagesWidgetEntities]),
    [currentPageWidgetEntities, otherPagesWidgetEntities],
  );

  const stop = performance.now();
  log.debug("Explorer hook props calculations took", stop - start, "ms");
  return {
    widgets: allWidgetEntities,
    actions: actionEntities as DataTreeAction[],
    dataSources: datasourceEntities,
    currentPageId,
    plugins,
    pages,
    searchKeyword: searchKeyword ?? undefined,
    clearSearch,
  };
};

export const useEntityUpdateState = (entityId: string) => {
  return useSelector(
    (state: AppState) => state.ui.explorer.updatingEntity === entityId,
  );
};

export const useEntityEditState = (entityId: string) => {
  return useSelector(
    (state: AppState) => state.ui.explorer.editingEntityName === entityId,
  );
};
