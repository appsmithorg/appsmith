import { useEffect, MutableRefObject, useState } from "react";
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

export const useEntities = () => {
  let canvasWidgets = useSelector((state: AppState) => {
    return state.entities.canvasWidgets;
  });

  const metaProps = useSelector((state: AppState) => {
    return state.entities.meta;
  });

  canvasWidgets = merge(canvasWidgets, metaProps);

  const currentPageId = useSelector((state: AppState) => {
    return state.entities.pageList.currentPageId;
  });

  const widgetTree = CanvasWidgetsNormalizer.denormalize("0", {
    canvasWidgets,
  });

  widgetTree.ENTITY_TYPE = ENTITY_TYPE.WIDGET;
  widgetTree.pageId = currentPageId;

  const actions = useSelector((state: AppState) => {
    return state.entities.actions.map(action => ({
      ...action,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
    }));
  });

  const pages: Array<Page & { ENTITY_TYPE: ENTITY_TYPE }> = useSelector(
    (state: AppState) => {
      return state.entities.pageList.pages.map(page => {
        return { ...page, ENTITY_TYPE: ENTITY_TYPE.PAGE };
      });
    },
  );

  const dataSources = useSelector((state: AppState) => {
    return state.entities.datasources.list;
  });

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  return { widgetTree, actions, pages, currentPageId, dataSources, plugins };
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
  const [entities, setEntities] = useState<{
    widgets?: any;
    actions?: Array<GenericAction>;
    dataSources?: Datasource[];
  }>({});
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);
  const {
    widgetTree,
    actions,
    dataSources,
    pages,
    currentPageId,
    plugins,
  } = useEntities();
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (searchKeyword !== null) {
      const filtered = {
        widgets: findWidgets(widgetTree, searchKeyword.toLowerCase()),
        actions: findActions(actions, searchKeyword.toLowerCase()),
        dataSources: findDataSources(dataSources, searchKeyword.toLowerCase()),
      };
      setEntities(filtered);
    } else {
      setEntities({ widgets: widgetTree, actions, dataSources });
    }
  }, [searchKeyword]);

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
  return { ...entities, currentPageId, plugins, pages };
};
