import styled from "styled-components";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";

import { AppState } from "@appsmith/reducers";
import { getDatasource, getDatasources } from "selectors/entitiesSelector";
import { useSelector, useDispatch } from "react-redux";
import { Datasource } from "entities/Datasource";
import { isNameValid } from "utils/helpers";
import {
  saveDatasourceName,
  updateDatasourceName,
} from "actions/datasourceActions";
import { Spinner } from "@blueprintjs/core";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";

const Wrapper = styled.div`
  margin-left: 10px;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  display: flex;
`;

interface ComponentProps {
  focusOnMount: boolean;
  disabled?: boolean;
}

type FormTitleProps = ComponentProps;

function FormTitle(props: FormTitleProps) {
  const params = useParams<{ datasourceId: string }>();
  const currentDatasource:
    | Datasource
    | undefined = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );
  const datasources: Datasource[] = useSelector(getDatasources);
  const [forceUpdate, setForceUpdate] = useState(false);
  const dispatch = useDispatch();
  const saveStatus: {
    isSaving: boolean;
    error: boolean;
  } = useSelector((state: AppState) => {
    const id = currentDatasource ? currentDatasource.id : "";

    return {
      isSaving: state.ui.datasourceName.isSaving[id],
      error: state.ui.datasourceName.errors[id],
    };
  });

  const hasNameConflict = React.useCallback(
    (name: string) => {
      const datasourcesNames: Record<string, any> = {};
      datasources
        // in case of REST API and Authenticated GraphQL API, when user clicks on save as datasource
        // we first need to update the action and then redirect to action page,
        // for that reason we need temporary datasource data to exist in store till action is updated,
        // if temp datasource data is there, then duplicate name issue occurs
        // hence added extra condition for REST and GraphQL.
        .filter(
          (datasource) =>
            datasource.id !== currentDatasource?.id &&
            !(
              datasource.name === currentDatasource?.name &&
              ["REST API", "Authenticated GraphQL API"].includes(
                (datasource as any).pluginName,
              ) &&
              datasource.pluginId === currentDatasource?.pluginId
            ),
        )
        .map((datasource) => {
          datasourcesNames[datasource.name] = datasource;
        });

      return !isNameValid(name, { ...datasourcesNames });
    },
    [datasources, currentDatasource],
  );

  const isInvalidDatasourceName = React.useCallback(
    (name: string): string | boolean => {
      if (!name || name.trim().length === 0) {
        return "Please enter a valid name";
      } else if (hasNameConflict(name)) {
        return `${name} is already being used or is a restricted keyword.`;
      }
      return false;
    },
    [hasNameConflict],
  );

  const handleDatasourceNameChange = useCallback(
    (name: string) => {
      // Check if the datasource name equals "Untitled Datasource ABC" if no , use the name passed.
      const datsourceName = name || "Untitled Datasource ABC";
      if (
        !isInvalidDatasourceName(name) &&
        currentDatasource &&
        currentDatasource.name !== name
      ) {
        // if the currentDatasource id equals the temp datasource id,
        // it means that you are about to create a new datasource hence
        // saveDatasourceName would be dispatch
        if (currentDatasource.id === TEMP_DATASOURCE_ID) {
          dispatch(
            saveDatasourceName({
              id: currentDatasource?.id ?? "",
              name: datsourceName,
            }),
          );
        } else {
          dispatch(
            updateDatasourceName({
              id: currentDatasource?.id ?? "",
              name: datsourceName,
            }),
          );
        }
      }
    },
    [dispatch, isInvalidDatasourceName, currentDatasource],
  );

  useEffect(() => {
    if (saveStatus.isSaving === false && saveStatus.error === true) {
      setForceUpdate(true);
    } else if (saveStatus.isSaving === true) {
      setForceUpdate(false);
    }
  }, [saveStatus.isSaving, saveStatus.error]);

  return (
    <Wrapper>
      <EditableText
        className="t--edit-datasource-name"
        defaultValue={currentDatasource ? currentDatasource.name : ""}
        disabled={props.disabled}
        editInteractionKind={EditInteractionKind.SINGLE}
        forceDefault={forceUpdate}
        isEditingDefault={props.focusOnMount}
        isInvalid={isInvalidDatasourceName}
        maxLength={30}
        onTextChanged={handleDatasourceNameChange}
        placeholder="Datasource Name"
        type="text"
        underline
        updating={saveStatus.isSaving}
      />
      {saveStatus.isSaving && <Spinner size={16} />}
    </Wrapper>
  );
}

export default FormTitle;
