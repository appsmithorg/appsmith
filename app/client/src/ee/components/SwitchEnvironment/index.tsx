import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import { connect, useDispatch, useSelector } from "react-redux";
import type { EnvironmentType } from "@appsmith/reducers/environmentReducer";
import {
  getEnvironmentsWithPermission,
  getDefaultEnvironment,
} from "@appsmith/selectors/environmentSelectors";
import { Option, Select, Text, toast } from "design-system";
import {
  ENVIRONMENT_ID_LOCAL_STORAGE_KEY,
  ENVIRONMENT_QUERY_KEY,
  updateLocalStorage,
} from "@appsmith/utils/Environments";
import { softRefreshActions } from "actions/pluginActionActions";
import {
  START_SWITCH_ENVIRONMENT,
  createMessage,
} from "@appsmith/constants/messages";
import { matchDatasourcePath, matchSAASGsheetsPath } from "constants/routes";
import { isDatasourceInViewMode } from "selectors/ui";
import { useLocation } from "react-router";
import { datasourceEnvEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Wrapper = styled.div`
  display: flex;
  border-right: 1px solid var(--ads-v2-color-border);
  padding: 0px 16px;

  .rc-select-selector {
    min-width: 160px;
    width: 160px;
    border: none;
  }
`;

export type SwitchEnvironmentProps = {
  defaultEnvironment?: EnvironmentType;
  environmentList: Array<EnvironmentType>;
  viewMode?: boolean;
};

const SwitchEnvironment = ({
  defaultEnvironment,
  environmentList,
  viewMode,
}: SwitchEnvironmentProps) => {
  const [diableSwitchEnvironment, setDiableSwitchEnvironment] = useState(false);
  // state to store the selected environment
  const [selectedEnv, setSelectedEnv] = useState(defaultEnvironment);
  // Fetching feature flags from the store and checking if the feature is enabled
  const allowedToRender = useSelector(datasourceEnvEnabled);
  const dispatch = useDispatch();
  const location = useLocation();
  //listen to url change and disable switch environment if datasource page is open
  useEffect(() => {
    setDiableSwitchEnvironment(
      !!matchDatasourcePath(window.location.pathname) ||
        !!matchSAASGsheetsPath(window.location.pathname),
    );
  }, [location.pathname]);
  //URL for datasource edit and review page is same
  //this parameter helps us to differentiate between the two.
  const isDatasourceViewMode = useSelector(isDatasourceInViewMode);

  useEffect(() => {
    !!selectedEnv && updateLocalStorage(selectedEnv.name, selectedEnv.id);
  }, [environmentList.length]);

  // function to set the selected environment
  const setSelectedEnvironment = (env: EnvironmentType) => {
    if (env.id !== selectedEnv?.id) {
      AnalyticsUtil.logEvent("SWITCH_ENVIRONMENT", {
        fromEnvId: selectedEnv?.id,
        toEnvId: env.id,
        fromEnvName: selectedEnv?.name,
        toEnvName: env.name,
        mode: viewMode ? "VIEW" : "EDIT",
      });
      const queryParams = new URLSearchParams(window.location.search);
      // Set new or modify existing parameter value.
      queryParams.set(ENVIRONMENT_QUERY_KEY, env.name.toLowerCase());
      updateLocalStorage(env.name, env.id);
      // Replace current querystring with the new one.
      window.history.replaceState({}, "", "?" + queryParams.toString());
      setSelectedEnv(env);
      toast.show(createMessage(START_SWITCH_ENVIRONMENT, env.name), {
        kind: "info",
        autoClose: 500,
      });
      dispatch(softRefreshActions());
    }
  };
  // skip the render if feature is not enabled or no environments are present
  if (!allowedToRender || environmentList.length <= 0) {
    return null;
  }

  // if no default environment is set, set the first environment as default
  if (!defaultEnvironment) {
    environmentList.length && setSelectedEnvironment(environmentList[0]);
  }
  return (
    <Wrapper
      aria-disabled={diableSwitchEnvironment && !isDatasourceViewMode}
      data-testid="t--switch-env"
    >
      <Select
        className="select_environemnt"
        dropdownClassName="select_environemnt_dropdown"
        isDisabled={
          (diableSwitchEnvironment && !isDatasourceViewMode) ||
          environmentList.length === 1
        }
        onSelect={setSelectedEnvironment}
        value={
          selectedEnv &&
          selectedEnv.name.charAt(0).toUpperCase() + selectedEnv.name.slice(1)
        }
      >
        {environmentList.map((env: EnvironmentType) => (
          <Option
            aria-checked={env.id === selectedEnv?.id}
            data-testid={`t--switch-env-dropdown-option-${env.name}`}
            key={env.id}
            label={env.name}
            value={env}
          >
            <div className="flex flex-col gap-1">
              <Text color="var(--ads-v2-color-fg-emphasis)">
                {env.name.charAt(0).toUpperCase() + env.name.slice(1)}
              </Text>
            </div>
          </Option>
        ))}
      </Select>
    </Wrapper>
  );
};

const mapStateToProps = (state: AppState) => {
  const environmentList = getEnvironmentsWithPermission(state);
  let defaultEnvironment;

  if (!!environmentList && environmentList.length > 0) {
    // check queryParams to see if environment is already set
    const queryParams = new URLSearchParams(window.location.search);

    if (queryParams.has(ENVIRONMENT_QUERY_KEY)) {
      const environmentName = queryParams.get(ENVIRONMENT_QUERY_KEY) || "";
      if (!!environmentName && environmentList.length > 0) {
        defaultEnvironment = environmentList.find(
          (env: EnvironmentType) => env.name.toLowerCase() === environmentName,
        );
      }
    }

    if (!defaultEnvironment) {
      const environmenId =
        localStorage.getItem(ENVIRONMENT_ID_LOCAL_STORAGE_KEY) || "";
      if (!!environmenId && environmentList.length > 0) {
        defaultEnvironment = environmentList.find(
          (env: EnvironmentType) => env.id === environmenId,
        );
      }
    }

    if (!defaultEnvironment) {
      defaultEnvironment = getDefaultEnvironment(state);
    }
  }

  return {
    environmentList,
    defaultEnvironment,
  };
};

export default connect(mapStateToProps)(SwitchEnvironment);
