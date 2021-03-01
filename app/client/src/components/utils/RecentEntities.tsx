import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router";
import { getSelectedWidget } from "selectors/ui";
import {
  matchApiPath,
  matchDatasourcePath,
  matchQueryPath,
  matchBuilderPath,
} from "constants/routes";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { updateRecentEntity } from "actions/globalSearchActions";

const getRecentEntity = (pathName: string) => {
  const builderMatch = matchBuilderPath(pathName);
  if (builderMatch)
    return {
      type: "page",
      id: builderMatch?.params?.pageId,
      params: builderMatch?.params,
    };

  const apiMatch = matchApiPath(pathName);
  if (apiMatch)
    return {
      type: "action",
      id: apiMatch?.params?.apiId,
      params: apiMatch?.params,
    };

  const queryMatch = matchQueryPath(pathName);
  if (queryMatch)
    return {
      type: "action",
      id: queryMatch.params?.queryId,
      params: queryMatch?.params,
    };

  const datasourceMatch = matchDatasourcePath(pathName);
  if (datasourceMatch)
    return {
      type: "datasource",
      id: datasourceMatch?.params?.datasourceId,
      params: datasourceMatch?.params,
    };

  return {};
};

const RecentEntities = () => {
  const location = useLocation();
  const selectedWidget = useSelector(getSelectedWidget);
  const dispatch = useDispatch();

  useEffect(() => {
    const builderMatch = matchBuilderPath(window.location.pathname);
    if (selectedWidget && selectedWidget !== MAIN_CONTAINER_WIDGET_ID)
      dispatch(
        updateRecentEntity({
          type: "widget",
          id: selectedWidget,
          params: builderMatch?.params,
        }),
      );
  }, [selectedWidget]);

  useEffect(() => {
    const { type, id, params } = getRecentEntity(location.pathname);
    if (type && id && id.indexOf(":") === -1) {
      dispatch(updateRecentEntity({ type, id, params }));
    }
  }, [location.pathname]);
  return null;
};

export default RecentEntities;
