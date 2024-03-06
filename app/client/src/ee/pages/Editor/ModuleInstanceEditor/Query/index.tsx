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
import type { Action, PluginType } from "entities/Action";
import {
  runQueryModuleInstance,
  updateModuleInstanceOnPageLoadSettings,
  updateModuleInstanceSettings,
} from "@appsmith/actions/moduleInstanceActions";
import Loader from "../../ModuleEditor/Loader";
import ResponseView from "./ResponseView";
import { hasExecuteModuleInstancePermission } from "@appsmith/utils/permissionHelpers";
import useModuleFallbackSettingsForm from "../../ModuleEditor/useModuleFallbackSettingsForm";
import { getPackageById } from "@appsmith/selectors/packageSelectors";
import MissingModule from "../common/MissingModule";

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

const StyledSettingsWrapper = styled.div`
  width: 600px;
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
  const pkg = useSelector((state) =>
    getPackageById(state, module?.packageId || ""),
  );
  const publicAction = useSelector((state) =>
    getModuleInstancePublicAction(state, moduleInstanceId),
  );
  const hasMissingModule = Boolean(moduleInstance?.invalids?.length);
  const fallbackSettings = useModuleFallbackSettingsForm({
    pluginId: publicAction?.pluginId || "",
    pluginType: (publicAction?.pluginType as PluginType) || "",
    interfaceType: "CREATOR",
  });

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

  if (!moduleInstance || (!hasMissingModule && (!module || !publicAction))) {
    return <Loader />;
  }

  const moduleSettings =
    module && Boolean(module?.settingsForm.length)
      ? module?.settingsForm
      : fallbackSettings;

  return (
    <Container>
      <Header
        isDisabled={hasMissingModule}
        moduleId={module?.originModuleId}
        moduleInstance={moduleInstance}
        packageId={pkg?.originPackageId}
      >
        {!hasMissingModule && (
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
        )}
      </Header>
      <Body>
        {hasMissingModule && <MissingModule moduleInstance={moduleInstance} />}
        {!hasMissingModule && module && (
          <StyledSettingsWrapper>
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
              moduleInstanceId={moduleInstanceId}
              onFormValuesChange={onSettingsFormChange}
              settings={moduleSettings}
            />
          </StyledSettingsWrapper>
        )}
      </Body>
      {!hasMissingModule && publicAction && (
        <ResponseView
          action={publicAction}
          isExecutePermitted={isExecutePermitted}
          moduleInstance={moduleInstance}
          onRunClick={onRunClick}
        />
      )}
    </Container>
  );
}

export default QueryModuleInstanceEditor;
