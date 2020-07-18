import { useEffect, MutableRefObject, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { Page } from "constants/ReduxActionConstants";
import { merge, compact } from "lodash";
import { Datasource } from "api/DatasourcesApi";
import { Action, GenericAction } from "entities/Action";
import { debounce } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";

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

const findActions = (actions: Array<GenericAction>, keyword: string) => {
  return actions.filter(
    (action: { config: Action }) =>
      action.config.name.toLowerCase().indexOf(keyword) > -1,
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

  const canvasWidgets = useSelector((state: AppState) => {
    return state.entities.canvasWidgets;
  });

  const metaProps = useSelector((state: AppState) => {
    return state.entities.meta;
  });

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
    const widgets = merge(canvasWidgets, metaProps);
    const widgetTree = CanvasWidgetsNormalizer.denormalize("0", {
      canvasWidgets: widgets,
    });
    widgetTree.ENTITY_TYPE = ENTITY_TYPE.WIDGET;
    widgetTree.pageId = currentPageId;

    return searchKeyword !== null
      ? findWidgets(widgetTree, searchKeyword.toLowerCase())
      : widgetTree;
  }, [searchKeyword, canvasWidgets, metaProps, currentPageId]);

  const actionsState = useSelector((state: AppState) => {
    return state.entities.actions;
  });

  const actionEntities = useMemo(() => {
    const actions = actionsState.map(action => ({
      ...action,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
    }));
    return searchKeyword !== null
      ? findActions(actions, searchKeyword.toLowerCase())
      : actions;
  }, [searchKeyword, actionsState]);

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

  useEffect(() => {
    const el: HTMLInputElement | null = ref.current;
    el?.addEventListener("keydown", search);
    return () => {
      el?.removeEventListener("keydown", search);
    };
  }, [ref, search]);
  return {
    widgets: widgetEntities,
    actions: actionEntities,
    dataSources: datasourceEntities,
    currentPageId,
    plugins,
    pages,
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
