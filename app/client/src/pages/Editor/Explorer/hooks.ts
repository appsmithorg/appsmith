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
import { Page } from "constants/ReduxActionConstants";
import { compact } from "lodash";
import { Datasource } from "api/DatasourcesApi";
import { debounce } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { evaluateDataTreeWithFunctions } from "selectors/dataTreeSelectors";

const usePages = () => {
  const pageList: Page[] = useSelector((state: AppState) => {
    return state.entities.pageList.pages;
  });
  const defaultPageId = useSelector(
    (state: AppState) => state.entities.pageList.defaultPageId,
  );

  const pages: Array<Page & { ENTITY_TYPE: ENTITY_TYPE }> = pageList.map(
    (page: Page) => {
      return {
        ...page,
        ENTITY_TYPE: ENTITY_TYPE.PAGE,
        isDefault: page.pageId === defaultPageId,
      };
    },
  );
  return pages;
};

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
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);

  const dataTree: DataTree = useSelector(evaluateDataTreeWithFunctions);

  const canvasWidgets: { [id: string]: any } = {};
  Object.values(dataTree).forEach(
    (
      entity: DataTreeEntity & { ENTITY_TYPE?: ENTITY_TYPE; widgetId?: string },
    ) => {
      if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET && entity.widgetId) {
        canvasWidgets[entity.widgetId] = entity;
      }
    },
  );

  const actions = Object.values(dataTree).filter(
    (entity: DataTreeEntity & { ENTITY_TYPE?: ENTITY_TYPE }) =>
      entity.ENTITY_TYPE === ENTITY_TYPE.ACTION,
  );

  const pages = usePages();

  const currentPageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });

  const dataSources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });

  const widgetEntities = useMemo(() => {
    const widgetTree = CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets,
    });
    widgetTree.ENTITY_TYPE = ENTITY_TYPE.WIDGET;
    widgetTree.pageId = currentPageId;

    return searchKeyword !== null
      ? findWidgets(widgetTree, searchKeyword.toLowerCase())
      : widgetTree;
  }, [searchKeyword, canvasWidgets, currentPageId]);

  const actionEntities = useMemo(() => {
    return searchKeyword !== null
      ? findActions(actions as DataTreeAction[], searchKeyword.toLowerCase())
      : actions;
  }, [searchKeyword, actions]);

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

  return {
    widgets: widgetEntities,
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
