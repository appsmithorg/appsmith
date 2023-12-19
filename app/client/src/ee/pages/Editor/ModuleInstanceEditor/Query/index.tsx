import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Button, Divider } from "design-system";

import InputsForm from "../common/InputsForm";
import { Header, Body, Container } from "../common";
import {
  getIsModuleInstanceRunningStatus,
  getModuleInstanceById,
  getModuleInstancePublicAction,
} from "@appsmith/selectors/moduleInstanceSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import SettingsForm from "./SettingsForm";
import type { Action } from "entities/Action";
import {
  runQueryModuleInstance,
  updateModuleInstanceOnPageLoadSettings,
  updateModuleInstanceSettings,
} from "@appsmith/actions/moduleInstanceActions";
import Loader from "../../ModuleEditor/Loader";
import ResponseView from "./ResponseView";
import { hasExecuteModuleInstancePermission } from "@appsmith/utils/permissionHelpers";

export interface QueryModuleInstanceEditorProps {
  moduleInstanceId: string;
}

const StyledInputsFormWrapper = styled.div`
  width: 270px;
`;

const StyledDivider = styled(Divider)`
  display: block;
  margin: var(--ads-spaces-7) 0;
`;

function QueryModuleInstanceEditor({
  moduleInstanceId,
}: QueryModuleInstanceEditorProps) {
  const dispatch = useDispatch();
  const moduleInstance = useSelector((state) =>
    getModuleInstanceById(state, moduleInstanceId),
  );
  const module = useSelector((state) =>
    getModuleById(state, moduleInstance?.sourceModuleId || ""),
  );
  const publicAction = useSelector((state) =>
    getModuleInstancePublicAction(state, moduleInstanceId),
  );

  const isExecutePermitted = hasExecuteModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

  const { isRunning } = useSelector((state) =>
    getIsModuleInstanceRunningStatus(state, moduleInstanceId),
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

  const onRunClick = useCallback(() => {
    dispatch(runQueryModuleInstance({ id: moduleInstance?.id || "" }));
  }, [moduleInstance?.id]);

  if (!moduleInstance || !module || !publicAction) {
    return <Loader />;
  }

  return (
    <Container>
      <Header moduleInstance={moduleInstance}>
        <Button
          className="t--run-module-instance"
          data-guided-tour-id="run-module-instance"
          isDisabled={!isExecutePermitted}
          isLoading={isRunning}
          onClick={onRunClick}
          size="md"
        >
          Run
        </Button>
      </Header>
      <Body>
        <StyledInputsFormWrapper>
          <InputsForm
            defaultValues={{ inputs: moduleInstance.inputs }}
            inputsForm={module.inputsForm}
            moduleInstanceId={moduleInstanceId}
            moduleInstanceName={moduleInstance.name}
          />
        </StyledInputsFormWrapper>
        <StyledDivider />
        <SettingsForm
          initialValues={publicAction}
          onFormValuesChange={onSettingsFormChange}
          settings={module.settingsForm}
        />
      </Body>
      <ResponseView
        action={publicAction}
        isExecutePermitted={isExecutePermitted}
        moduleInstance={moduleInstance}
        onRunClick={onRunClick}
      />
    </Container>
  );
}

export default QueryModuleInstanceEditor;
