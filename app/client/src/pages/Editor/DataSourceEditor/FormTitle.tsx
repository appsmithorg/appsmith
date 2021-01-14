import styled from "styled-components";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";

import { AppState } from "reducers";
import { getDatasource } from "selectors/entitiesSelector";
import { useSelector, useDispatch } from "react-redux";
import { Datasource } from "entities/Datasource";
import { getDataSources } from "selectors/editorSelectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isNameValid } from "utils/helpers";
import { saveDatasourceName } from "actions/datasourceActions";
import { Spinner } from "@blueprintjs/core";
import { getCurrentStep, inOnboarding } from "sagas/OnboardingSagas";

const Wrapper = styled.div`
  margin-left: 10px;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  display: flex;
`;

interface ComponentProps {
  focusOnMount: boolean;
}

type FormTitleProps = ComponentProps;

const FormTitle = (props: FormTitleProps) => {
  const params = useParams<{ datasourceId: string }>();
  const currentDatasource:
    | Datasource
    | undefined = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );
  const datasources: Datasource[] = useSelector(getDataSources);
  const evalTree = useSelector(getDataTree);
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

  // For onboarding
  const hideEditIcon = useSelector((state: AppState) => {
    const currentStep = getCurrentStep(state);
    const isInOnboarding = inOnboarding(state);

    return isInOnboarding && currentStep < 3;
  });

  const hasNameConflict = React.useCallback(
    (name: string) => {
      const datasourcesNames: Record<string, any> = {};
      datasources
        .filter((datasource) => datasource.id !== currentDatasource?.id)
        .map((datasource) => {
          datasourcesNames[datasource.name] = datasource;
        });

      return !isNameValid(name, { ...datasourcesNames, ...evalTree });
    },
    [datasources, currentDatasource],
  );

  const isInvalidDatasourceName = React.useCallback(
    (name: string): string | boolean => {
      if (!name || name.trim().length === 0) {
        return "Please enter a valid name";
      } else if (hasNameConflict(name)) {
        return `${name} is already being used.`;
      }
      return false;
    },
    [hasNameConflict],
  );

  const handleDatasourceNameChange = useCallback(
    (name: string) => {
      if (
        !isInvalidDatasourceName(name) &&
        currentDatasource &&
        currentDatasource.name !== name
      ) {
        dispatch(saveDatasourceName({ id: currentDatasource?.id ?? "", name }));
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
        type="text"
        hideEditIcon={hideEditIcon}
        forceDefault={forceUpdate}
        defaultValue={currentDatasource ? currentDatasource.name : ""}
        isInvalid={isInvalidDatasourceName}
        onTextChanged={handleDatasourceNameChange}
        placeholder="Datasource Name"
        editInteractionKind={EditInteractionKind.SINGLE}
        isEditingDefault={props.focusOnMount && !hideEditIcon}
        updating={saveStatus.isSaving}
      />
      {saveStatus.isSaving && <Spinner size={16} />}
    </Wrapper>
  );
};

export default FormTitle;
