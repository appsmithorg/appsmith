import React from "react";
import QuickGitActions from "pages/Editor/gitSync/QuickGitActions";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import HelpButton from "pages/Editor/HelpButton";
import ManualUpgrades from "./ManualUpgrades";
import { Button } from "design-system";
import SwitchEnvironment from "@appsmith/components/SwitchEnvironment";
import { Container, Wrapper } from "./components";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { useDispatch } from "react-redux";
import { softRefreshActions } from "actions/pluginActionActions";
import { START_SWITCH_ENVIRONMENT } from "@appsmith/constants/messages";
import { getIsAnvilLayoutEnabled } from "layoutSystems/anvil/integrations/selectors";

export default function BottomBar({ viewMode }: { viewMode: boolean }) {
  const appId = useSelector(getCurrentApplicationId) || "";
  const dispatch = useDispatch();
  const isAnvilEnabled = useSelector(getIsAnvilLayoutEnabled);

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
