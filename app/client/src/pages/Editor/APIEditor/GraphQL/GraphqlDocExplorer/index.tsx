import React, { useCallback, useEffect } from "react";
import { buildClientSchema } from "graphql";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getDatasourceStructureByDatasourceId,
  getIsFetchingDatasourceStructure,
} from "selectors/entitiesSelector";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import { Action, EmbeddedApiAction } from "entities/Action";
import { getActionById } from "selectors/editorSelectors";
import { fetchActionStructure } from "actions/apiPaneActions";
import ExplorerContextProvider from "./contexts/explorer";
import Explorer from "./Explorer";
import schemaJSON from "./schema.json";
import { ExplorerWrapper } from "./css";

type GraphqlDocExplorer = {
  actionId: string;
  datasourceId?: string;
};

const GraphqlDocExplorer = (props: GraphqlDocExplorer) => {
  const dispatch = useDispatch();

  const datasourceStructure = useSelector((state: AppState) => {
    return getDatasourceStructureByDatasourceId(
      state,
      props.datasourceId ?? "",
    );
  });

  const isFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const action: Action | undefined = useSelector((state: AppState) => {
    return getActionById(state, {
      match: { params: { apiId: props.actionId } },
    });
  });

  const getActionOrDatasourceStructure = useCallback(() => {
    if (!datasourceStructure?.schema && props.datasourceId) {
      dispatch(fetchDatasourceStructure(props.datasourceId));
    } else if (action && !(action as EmbeddedApiAction).structure?.schema) {
      dispatch(fetchActionStructure(props.actionId));
    }
  }, [datasourceStructure, props.actionId, props.datasourceId, dispatch]);

  // const refetchActionOrDatasourceStructure = useCallback(() => {
  //   if (props.datasourceId) {
  //     dispatch(fetchDatasourceStructure(props.datasourceId));
  //   } else {
  //     dispatch(fetchActionStructure(props.actionId));
  //   }
  // }, [props.actionId, props.datasourceId, dispatch]);

  useEffect(() => {
    getActionOrDatasourceStructure();
  }, [props.actionId, props.datasourceId]);

  const schema = props.datasourceId
    ? datasourceStructure?.schema
    : (action as EmbeddedApiAction).structure?.schema;

  const isFetching = props.datasourceId
    ? isFetchingDatasourceStructure
    : (action as EmbeddedApiAction).structure?.isFetching;

  const error = props.datasourceId
    ? datasourceStructure.error
    : (action as EmbeddedApiAction).structure?.error;

  let finalSchema;
  let validationErrors;

  try {
    finalSchema = buildClientSchema(schema || schemaJSON);
  } catch (err) {
    validationErrors = err;
  }

  return (
    <ExplorerContextProvider
      actionId={props.actionId}
      datasourceId={props.datasourceId}
    >
      <ExplorerWrapper>
        <Explorer
          error={error}
          isFetching={!!isFetching}
          schema={finalSchema}
          validationErrors={validationErrors}
        />
      </ExplorerWrapper>
    </ExplorerContextProvider>
  );
};

export default GraphqlDocExplorer;
