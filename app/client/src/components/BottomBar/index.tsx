import React from "react";

import { softRefreshActions } from "actions/pluginActionActions";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import SwitchEnvironment from "ee/components/SwitchEnvironment";
import { START_SWITCH_ENVIRONMENT } from "ee/constants/messages";
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";
import HelpButton from "pages/Editor/HelpButton";
import QuickGitActions from "pages/Editor/gitSync/QuickGitActions";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import { Button } from "@appsmith/ads";

import ManualUpgrades from "./ManualUpgrades";
import { Container, Wrapper } from "./components";

export default function BottomBar({ viewMode }: { viewMode: boolean }) {
  const appId = useSelector(getCurrentApplicationId) || "";
  const dispatch = useDispatch();
  // We check if the current application is an Anvil application.
  // If it is an Anvil application, we remove the Git features from the bottomBar
  // as they donot yet work correctly with Anvil.
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

  const onChangeEnv = () => {
    dispatch(softRefreshActions());
  };

  return (
    <Container>
      <Wrapper>
        {!viewMode && (
          <SwitchEnvironment
            editorId={appId}
            onChangeEnv={onChangeEnv}
            startSwitchEnvMessage={START_SWITCH_ENVIRONMENT}
            viewMode={viewMode}
          />
        )}
        {!viewMode && !isAnvilEnabled && <QuickGitActions />}
      </Wrapper>
      {!viewMode && (
        <Wrapper>
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
