import {
  useEffect,
  MutableRefObject,
  useState,
  useMemo,
  useCallback,
  MouseEvent,
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
import log from "loglevel";

export const useClick = (
  currentRef: MutableRefObject<HTMLElement | null>,
  singleClk: (e: MouseEvent<HTMLElement>) => void,
  doubleClk?: (e: MouseEvent<HTMLElement>) => void,
) => {
  useEffect(() => {
    let clickCount = 0;
    let timeoutId = 0;

    const handleClick = (e: any) => {
      if (!doubleClk) {
        singleClk(e);
      } else {
        clickCount++;
        if (clickCount === 2 && doubleClk) {
          doubleClk(e);
          clearTimeout(timeoutId);
          clickCount = 0;
        } else {
          timeoutId = setTimeout(() => {
            singleClk(e);
            clickCount = 0;
          }, 200);
        }
      }
    };

    const el = currentRef.current;
    el?.addEventListener("click", handleClick);
    return () => {
      el?.removeEventListener("click", handleClick);
    };
  }, [currentRef, singleClk, doubleClk]);
};

const findWidgets = (widgets: WidgetProps, keyword: string) => {
  if (widgets.children) {
    widgets.children = compact(
      widgets.children.map((widget: WidgetProps) =>
        findWidgets(widget, keyword),
      ),
    );
    return widgets.children.length > 0 ||
      widgets.widgetName.toLowerCase().indexOf(keyword) > -1
      ? widgets
      : undefined;
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

export const useFilteredDatasources = (searchKeyword?: string) => {
  const dataSources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });

  return useMemo(
    () =>
      searchKeyword
        ? findDataSources(dataSources, searchKeyword.toLowerCase())
        : dataSources,
    [searchKeyword, dataSources],
  );
};

export const useDataTreeActions = (searchKeyword?: string) => {
  const dataTree: DataTree = useSelector(evaluateDataTreeWithFunctions);
  const actions = useMemo(
    () =>
      Object.values(dataTree).filter(
        (entity: DataTreeEntity & { ENTITY_TYPE?: ENTITY_TYPE }) =>
          entity.ENTITY_TYPE === ENTITY_TYPE.ACTION,
      ),
    [dataTree],
  );

  return useMemo(
    () =>
      searchKeyword
        ? findActions(actions as DataTreeAction[], searchKeyword.toLowerCase())
        : actions,
    [searchKeyword, actions],
  );
};

export const useDataTreeWidgets = (searchKeyword?: string) => {
  const dataTree: DataTree = useSelector(evaluateDataTreeWithFunctions);
  const widgets = useMemo(() => {
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

    return CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets,
    });
  }, [dataTree]);

  return useMemo(
    () =>
      searchKeyword
        ? findWidgets(widgets, searchKeyword.toLowerCase())
        : widgets,
    [searchKeyword, widgets],
  );
};

export const usePageActions = (pageId: string, searchKeyword?: string) => {
  const reducerActions = useSelector((state: AppState) =>
    state.entities.actions.filter(action => action.config.pageId === pageId),
  );
  const actions = useMemo(
    () =>
      reducerActions.map(action => ({
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
      })),
    [reducerActions],
  );

  return useMemo(
    () =>
      searchKeyword
        ? findActions(actions as DataTreeAction[], searchKeyword.toLowerCase())
        : actions,
    [searchKeyword, actions],
  );
};

export const usePageWidgets = (pageId: string, searchKeyword?: string) => {
  const pageDSL = useSelector((state: AppState) => state.ui.pageDSLs[pageId]);
  return useMemo(
    () =>
      searchKeyword && pageDSL
        ? findWidgets(pageDSL, searchKeyword.toLowerCase())
        : pageDSL,
    [searchKeyword, pageDSL],
  );
};

export const useFilteredEntities = (
  ref: MutableRefObject<HTMLInputElement | null>,
) => {
  const start = performance.now();
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);

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

  const stop = performance.now();
  log.debug("Explorer hook props calculations took", stop - start, "ms");
  return {
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
