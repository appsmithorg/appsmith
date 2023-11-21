import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Divider } from "design-system";
import type { RouteComponentProps } from "react-router";

import InputsForm from "../common/InputsForm";
import { Header, Body, Container } from "../common";
import {
  getModuleInstanceById,
  getModuleInstancePublicAction,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import SettingsForm from "./SettingsForm";
import type { Action } from "entities/Action";
import {
  updateModuleInstanceOnPageLoadSettings,
  updateModuleInstanceSettings,
} from "@appsmith/actions/moduleInstanceActions";
import Loader from "../../ModuleEditor/Loader";

interface QueryModuleInstanceRouteParams {
  moduleInstanceId: string;
}

export type QueryModuleInstanceEditorProps =
  RouteComponentProps<QueryModuleInstanceRouteParams>;

const StyledInputsFormWrapper = styled.div`
  width: 270px;
`;

const StyledDivider = styled(Divider)`
  display: block;
  margin: var(--ads-spaces-7) 0;
`;

function QueryModuleInstanceEditor(props: QueryModuleInstanceEditorProps) {
  const { moduleInstanceId } = props.match.params;
  const dispatch = useDispatch();
  const moduleInstance = useSelector((state) =>
    getModuleInstanceById(state, moduleInstanceId),
  );
  const module = useSelector((state) =>
    getModuleById(state, moduleInstance?.moduleId || ""),
  );
  const publicAction = useSelector((state) =>
    getModuleInstancePublicAction(state, moduleInstanceId),
  );

  const onSettingsFormChange = useCallback(
    (values?: Action) => {
      if (!publicAction) return;

      if (publicAction?.executeOnLoad != values?.executeOnLoad) {
        dispatch(
          updateModuleInstanceOnPageLoadSettings({
            actionId: publicAction.id,
            value: values?.executeOnLoad,
          }),
        );
      } else {
        dispatch(updateModuleInstanceSettings(values));
      }
    },

    [publicAction?.executeOnLoad, publicAction?.id],
  );

  if (!moduleInstance || !module || !publicAction) {
    return <Loader />;
  }

  return (
    <Container>
      <Header moduleInstance={moduleInstance} />
      <Body>
        <StyledInputsFormWrapper>
          <InputsForm
            defaultValues={{ inputs: moduleInstance.inputs }}
            inputsForm={module.inputsForm}
            moduleInstanceId={moduleInstanceId}
          />
        </StyledInputsFormWrapper>
        <StyledDivider />
        <SettingsForm
          initialValues={publicAction}
          onFormValuesChange={onSettingsFormChange}
          settings={module.settingsForm}
        />
      </Body>
    </Container>
  );
}

export default QueryModuleInstanceEditor;
