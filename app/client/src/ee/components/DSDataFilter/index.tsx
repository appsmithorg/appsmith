import type { EnvironmentType } from "@appsmith/configs/types";
import {
  allowManageEnvironmentAccessForWorkspace,
  getEnvironments,
  renderEnvWalkthrough,
} from "@appsmith/selectors/environmentSelectors";
import { Text, Icon, Tooltip } from "design-system";
import { capitalizeFirstLetter } from "pages/Editor/gitSync/QuickGitActions";
import styled from "styled-components";
import React, { useContext, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import {
  createMessage,
  ENVIRONMENT_FILTER_DISABLED_TOOLTIP,
} from "@appsmith/constants/messages";
import {
  DB_NOT_SUPPORTED,
  dsEditorEnvWalkthroughConfig,
} from "@appsmith/utils/Environments";
import type { PluginType } from "entities/Action";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import type { AppState } from "@appsmith/reducers";
import { DEFAULT_ENV_ID } from "@appsmith/api/ApiUtils";
import { showProductRamps } from "@appsmith/selectors/rampSelectors";
import { RAMP_NAME } from "utils/ProductRamps/RampsControlList";
import CE_DSDataFilter from "ce/components/DSDataFilter";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import history from "utils/history";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import {
  getFeatureWalkthroughShown,
  setFeatureWalkthroughShown,
} from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

export const defaultEnvironment = (workspaceId: string): EnvironmentType => ({
  id: DEFAULT_ENV_ID,
  name: "Default",
  isDefault: true,
  userPermissions: [],
  workspaceId,
  isLocked: true,
});

const Container = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ads-v2-color-border);
  width: 160px;
  height: 100%;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 160px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
`;

const ManageEnvironmentsButton = styled.div`
  display: flex;
  margin-top: auto;
  height: 64px;
  align-items: center;
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-color-background-secondary);
  padding: 8px;
  gap: 8px;
  cursor: pointer;
`;

const DisabledICon = styled(Icon)`
  margin-left: auto;
`;
const FilterComponentContainer = styled.div<{
  isSelected: boolean;
  disabled: boolean;
}>`
  display: flex;
  flex-direction: row;
  padding: 12px 8px;
  align-items: center;
  justify-content: flex-start;
  border-radius: var(--ads-v2-border-radius);
  width: 159px;

  ${(props) =>
    props.isSelected && `background: var(--ads-color-background-secondary);`}

  ${(props) => (props.disabled ? ` cursor: not-allowed;` : `cursor: pointer;`)}
`;

const WALKTHROUGH_GUIDE_GIF = `${ASSETS_CDN_URL}/env_config.gif`;

const WALKTHROUGH_SECTION_ID = "t--ds-data-filter-container";

const FilterComponentLabel = styled(Text)<{ disabled: boolean }>`
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  text-overflow: ellipsis;
  overflow: hidden;
`;

interface ReduxStateProps {
  isSaving: boolean;
  isTesting: boolean;
}

interface DSDataFilterProps {
  updateFilter: (
    id: string,
    name: string,
    userPermissions: string[],
  ) => boolean;
  pluginType: string;
  pluginName: string;
  isInsideReconnectModal: boolean;
  isSaving: boolean;
  isTesting: boolean;
  viewMode: boolean;
  filterId: string; // id of the selected environment, used to keep the parent and child in sync
}

const DSDataFilter = ({
  filterId,
  isInsideReconnectModal,
  isSaving,
  isTesting,
  pluginName,
  pluginType,
  updateFilter,
  viewMode,
}: DSDataFilterProps) => {
  const environments = useSelector((state: any) => getEnvironments(state));
  const [showFilterPane, setShowFilterPane] = React.useState(false);
  const isMultipleEnvEnabled = useFeatureFlag(
    FEATURE_FLAG.release_datasource_environments_enabled,
  );
  const workspace = useSelector(getCurrentAppWorkspace);
  const allowCustomEnvFeature = useSelector((state: AppState) =>
    allowManageEnvironmentAccessForWorkspace(
      state,
      workspace.userPermissions || [],
    ),
  );
  const defaultSelectedEnvironment =
    environments.find((env: any) => env.isDefault) ||
    defaultEnvironment(workspace.id);
  const [selectedEnvironment, setSelectedEnvironment] = React.useState(
    defaultSelectedEnvironment,
  );
  const showRamps = useSelector(showProductRamps(RAMP_NAME.MULTIPLE_ENV, true));

  useEffect(() => {
    if (!filterId) return;
    const selectedEnv = environments.find((env: any) => env.id === filterId);
    if (selectedEnv) setSelectedEnvironment(selectedEnv);
  }, [filterId]);

  // update the selected environment if the list of environments changes
  useEffect(() => {
    const isRenderAllowed =
      environments.length > 0 &&
      isMultipleEnvEnabled &&
      !viewMode &&
      !isInsideReconnectModal;

    if (showFilterPane !== isRenderAllowed) setShowFilterPane(isRenderAllowed);
    // If there are no environments, do nothing
    if (!environments.length) return;
    const id =
      environments.find((env: any) => env.isDefault)?.id ||
      defaultSelectedEnvironment.id;

    const updateSuccess = updateFilter(
      selectedEnvironment.id,
      selectedEnvironment.name,
      selectedEnvironment?.userPermissions || [],
    );

    if (!updateSuccess) return;

    // If the selected environment is the default environment, do nothing
    if (id === selectedEnvironment.id) return;
    // If the selected environment is present in the list of environments, set it as the selected environment
    setSelectedEnvironment(environments[0]);
  }, [environments.length, pluginType, viewMode, isInsideReconnectModal]);

  // Walkthrough section
  const { popFeature, pushFeature } = useContext(WalkthroughContext) || {};
  const renderWalkthrough = useSelector((state: AppState) =>
    renderEnvWalkthrough(state, 2),
  );

  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.env_walkthrough,
    );
    const imageURL = getAssetUrl(WALKTHROUGH_GUIDE_GIF);

    // Adding walkthrough tutorial
    !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature(
        dsEditorEnvWalkthroughConfig(
          WALKTHROUGH_SECTION_ID,
          closeWalkthrough,
          imageURL,
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

  if (!showFilterPane) {
    if (showRamps) {
      return (
        <CE_DSDataFilter
          filterId={filterId}
          isInsideReconnectModal={isInsideReconnectModal}
          pluginName={pluginName}
          pluginType={pluginType}
          updateFilter={updateFilter}
          viewMode={viewMode}
        />
      );
    }
    return null;
  }

  const renderOption = (env: EnvironmentType, isDisabled: boolean) => {
    const disabledState = isDisabled || isSaving || isTesting;
    return (
      <FilterComponentContainer
        disabled={disabledState}
        isSelected={env.id === selectedEnvironment.id}
        key={`${env.id}-parent`}
        onClick={() => {
          if (isDisabled) return;
          const updateSuccess = updateFilter(
            env.id,
            env.name,
            env.userPermissions || [],
          );
          if (updateSuccess) setSelectedEnvironment(env);
        }}
      >
        <FilterComponentLabel
          aria-disabled={disabledState}
          aria-selected={env.id === selectedEnvironment.id}
          data-testid={`t--ds-data-filter-${env.name}`}
          disabled={disabledState}
          key={env.id}
          kind={"body-m"}
        >
          {capitalizeFirstLetter(env.name)}
        </FilterComponentLabel>
        {isDisabled && (
          <DisabledICon
            data-testid="t--filter-disabled"
            name={"info"}
            size={"md"}
          />
        )}
      </FilterComponentContainer>
    );
  };

  return (
    <Container>
      <OptionsContainer id={WALKTHROUGH_SECTION_ID}>
        {environments.map((env: EnvironmentType) => {
          const isDisabled = DB_NOT_SUPPORTED.includes(
            pluginType as PluginType,
          );
          return isDisabled ? (
            <Tooltip
              content={createMessage(() =>
                ENVIRONMENT_FILTER_DISABLED_TOOLTIP(pluginName, env.name),
              )}
              placement="right"
            >
              {renderOption(
                env,
                isDisabled && env.id !== selectedEnvironment.id,
              )}
            </Tooltip>
          ) : (
            renderOption(env, isDisabled)
          );
        })}
      </OptionsContainer>
      {allowCustomEnvFeature && (
        <ManageEnvironmentsButton
          onClick={() => {
            history.push(`/workspace/${workspace.id}/settings/environments`);
          }}
        >
          <Icon name="settings-control" size="lg" />
          <Text kind="body-m">Manage Environments</Text>
        </ManageEnvironmentsButton>
      )}
    </Container>
  );
};

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  return {
    ...props,
    isSaving: state.entities.datasources.loading,
    isTesting: state.entities.datasources.isTesting,
  };
};

export default connect(mapStateToProps)(DSDataFilter);
