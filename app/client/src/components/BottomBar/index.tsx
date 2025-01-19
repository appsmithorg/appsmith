import React, { useCallback } from "react";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import HelpButton from "pages/Editor/HelpButton";
import ManualUpgrades from "./ManualUpgrades";
import { Button } from "@appsmith/ads";
import SwitchEnvironment from "ee/components/SwitchEnvironment";
import { Container, Wrapper } from "./components";
import { useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { useDispatch } from "react-redux";
import { softRefreshActions } from "actions/pluginActionActions";
import { START_SWITCH_ENVIRONMENT } from "ee/constants/messages";
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";
import PackageUpgradeStatus from "ee/components/BottomBar/PackageUpgradeStatus";
import OldGitQuickActions from "pages/Editor/gitSync/QuickGitActions";
import { GitQuickActions } from "git";
import { useGitModEnabled } from "pages/Editor/gitSync/hooks/modHooks";

function GitActions() {
  const isGitModEnabled = useGitModEnabled();

  return isGitModEnabled ? <GitQuickActions /> : <OldGitQuickActions />;
}

export default function BottomBar() {
  const appId = useSelector(getCurrentApplicationId) || "";
  // We check if the current application is an Anvil application.
  // If it is an Anvil application, we remove the Git features from the bottomBar
  // as they donot yet work correctly with Anvil.
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);
  const isPreviewMode = useSelector(previewModeSelector);
  const isGitEnabled = !isAnvilEnabled && !isPreviewMode;

  const dispatch = useDispatch();

  const onChangeEnv = useCallback(() => {
    dispatch(softRefreshActions());
  }, [dispatch]);

  return (
    <Container>
      <Wrapper>
        <SwitchEnvironment
          editorId={appId}
          onChangeEnv={onChangeEnv}
          startSwitchEnvMessage={START_SWITCH_ENVIRONMENT}
          viewMode={isPreviewMode}
        />
        {isGitEnabled && <GitActions />}
      </Wrapper>
      {!isPreviewMode && (
        <Wrapper>
          <PackageUpgradeStatus />
          <ManualUpgrades showTooltip>
            <Button
              className="t--upgrade"
              isIconButton
              kind="tertiary"
              size="md"
              startIcon="upgrade"
            />
          </ManualUpgrades>
          <DebuggerTrigger />
          <HelpButton />
        </Wrapper>
      )}
    </Container>
  );
}
