import styled from "styled-components";
import React from "react";
import { WrappedFieldInputProps } from "redux-form";
import { useParams } from "react-router-dom";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";

import { AppState } from "reducers";
import { getDatasource } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";
import { Datasource } from "api/DatasourcesApi";
import { getDataSources } from "selectors/editorSelectors";

const Wrapper = styled.div`
  margin-left: 10px;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
`;

interface ComponentProps {
  input: WrappedFieldInputProps;
  focusOnMount: boolean;
}

type FormTitleProps = ComponentProps;

const FormTitle = (props: FormTitleProps) => {
  const { input } = props;
  const params = useParams<{ datasourceId: string }>();
  const currentDatasource:
    | Partial<Datasource>
    | undefined = useSelector((state: AppState) =>
    getDatasource(state, params.datasourceId),
  );
  const datasources: Datasource[] = useSelector(getDataSources);

  const hasNameConflict = React.useCallback(
    (name: string) =>
      datasources.some(
        datasource =>
          datasource.name === name && datasource.id !== currentDatasource?.id,
      ),
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
    [currentDatasource, hasNameConflict],
  );

  return (
    <Wrapper>
      <EditableText
        type="text"
        defaultValue={input.value}
        isInvalid={isInvalidDatasourceName}
        onTextChanged={value => input.onChange(value)}
        placeholder="Datasource Name"
        editInteractionKind={EditInteractionKind.SINGLE}
        isEditingDefault={props.focusOnMount}
      />
    </Wrapper>
  );
};

export default FormTitle;
