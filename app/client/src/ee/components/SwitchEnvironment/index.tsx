import CE_SwitchEnvironment from "ce/components/SwitchEnvironment";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import { connect, useSelector } from "react-redux";
import type { CurrentEnvironmentDetails } from "@appsmith/reducers/environmentReducer";
import type { EnvironmentType } from "@appsmith/configs/types";
import {
  getEnvironmentsWithPermission,
  getDefaultEnvironment,
  getCurrentEnvironmentId,
  renderEnvWalkthrough,
} from "@appsmith/selectors/environmentSelectors";
import { Option, Select, Text, toast } from "design-system";
import {
  ENVIRONMENT_QUERY_KEY,
  envSwitcherWalkthroughConfig,
} from "@appsmith/utils/Environments";
import {
  START_SWITCH_ENVIRONMENT,
  createMessage,
} from "@appsmith/constants/messages";
import { matchDatasourcePath, matchSAASGsheetsPath } from "constants/routes";
import { isDatasourceInViewMode } from "selectors/ui";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  getFeatureWalkthroughShown,
  saveCurrentEnvironment,
  setFeatureWalkthroughShown,
} from "utils/storage";
import { setCurrentEnvironment } from "@appsmith/actions/environmentAction";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { createTempDatasourceFromForm } from "actions/datasourceActions";
import { PluginPackageName } from "entities/Action";
import { getPluginByPackageName } from "@appsmith/selectors/entitiesSelector";

const WALKTHROUGH_GUIDE_GIF = `${ASSETS_CDN_URL}/env_selection.gif`;

const WALKTHROUGH_SECTION_ID = "t--switch-env";

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

export interface SwitchEnvironmentProps {
  defaultEnvironment?: EnvironmentType;
  environmentList: Array<EnvironmentType>;
  viewMode?: boolean;
  setCurrentEnvDetails: (currentEnvDetails: CurrentEnvironmentDetails) => void;
  createTempDatasource?: (data: any) => void;
  postgresPluginId?: string;
  editorId: string;
  onChangeEnv?: () => void;
}

const SwitchEnvironment = ({
  createTempDatasource,
  defaultEnvironment,
  editorId,
  environmentList,
  onChangeEnv,
  postgresPluginId,
  setCurrentEnvDetails,
  viewMode,
}: SwitchEnvironmentProps) => {
  const [diableSwitchEnvironment, setDiableSwitchEnvironment] = useState(false);
  // state to store the selected environment
  const [selectedEnv, setSelectedEnv] = useState(defaultEnvironment);
  // Fetching feature flags from the store and checking if the feature is enabled
  const isMultipleEnvEnabled = useFeatureFlag(
    FEATURE_FLAG.release_datasource_environments_enabled,
  );
  const workspaceId: string = useSelector(getCurrentWorkspaceId);

  //listen to url change and disable switch environment if datasource page is open
  useEffect(() => {
    setDiableSwitchEnvironment(
      !!matchDatasourcePath(window.location.pathname) ||
        !!matchSAASGsheetsPath(window.location.pathname),
    );
  }, [window.location.pathname]);
  //URL for datasource edit and review page is same
  //this parameter helps us to differentiate between the two.
  const isDatasourceViewMode = useSelector(isDatasourceInViewMode);

  const renderWalkthrough = useSelector((state: AppState) =>
    renderEnvWalkthrough(state, 1),
  );

  // Walkthrough section
  const { popFeature, pushFeature } = useContext(WalkthroughContext) || {};

  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.env_walkthrough,
    );
    const imageURL = getAssetUrl(WALKTHROUGH_GUIDE_GIF);

    // Adding walkthrough tutorial
    !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature(
        envSwitcherWalkthroughConfig(
          WALKTHROUGH_SECTION_ID,
          closeWalkthrough,
          imageURL,
          createTempDatasource,
          postgresPluginId,
        ),
      );
  };

  const closeWalkthrough = (setFlag = true) => {
    popFeature && popFeature(FEATURE_WALKTHROUGH_KEYS.env_walkthrough);
    if (setFlag)
      setFeatureWalkthroughShown(
        FEATURE_WALKTHROUGH_KEYS.env_walkthrough,
        true,
      );
  };

  useEffect(() => {
    if (renderWalkthrough) checkAndShowWalkthrough();
  }, [renderWalkthrough]);

  useEffect(() => {
    !!selectedEnv && saveCurrentEnvironment(selectedEnv.id, editorId);
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
      setCurrentEnvDetails({
        id: env.id,
        name: env.name,
        editorId,
        workspaceId,
        editingId: env.id,
      });
      // Replace current querystring with the new one.
      window.history.replaceState({}, "", "?" + queryParams.toString());
      setSelectedEnv(env);
      toast.show(createMessage(START_SWITCH_ENVIRONMENT, env.name), {
        kind: "info",
        autoClose: 500,
      });
      if (onChangeEnv) {
        onChangeEnv();
      }
    }
  };

  // Show ramps if feature is not enabled or
  if (!isMultipleEnvEnabled)
    return <CE_SwitchEnvironment editorId={editorId} viewMode={viewMode} />;
  // skip the render if no environments are present
  if (environmentList.length <= 0) return null;

  // if no default environment is set, set the first environment as default
  if (!defaultEnvironment) {
    environmentList.length && setSelectedEnvironment(environmentList[0]);
  }
  return (
    <Wrapper
      aria-disabled={diableSwitchEnvironment && !isDatasourceViewMode}
      data-testid="t--switch-env"
      id={WALKTHROUGH_SECTION_ID}
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
  const postgresPlugin = getPluginByPackageName(
    state,
    PluginPackageName.POSTGRES,
  );

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
      const environmentId = getCurrentEnvironmentId(state) || "";
      if (!!environmentId && environmentList.length > 0) {
        defaultEnvironment = environmentList.find(
          (env: EnvironmentType) => env.id === environmentId,
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
    postgresPluginId: postgresPlugin?.id,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    setCurrentEnvDetails: (currentEnvDetails: CurrentEnvironmentDetails) => {
      dispatch(setCurrentEnvironment(currentEnvDetails));
    },
    createTempDatasource: (data: any) =>
      dispatch(createTempDatasourceFromForm(data)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SwitchEnvironment);
