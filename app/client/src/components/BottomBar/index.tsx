import React from "react";
import QuickGitActions from "pages/Editor/gitSync/QuickGitActions";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import HelpButton from "pages/Editor/HelpButton";
import ManualUpgrades from "./ManualUpgrades";
import { Button } from "design-system";
import SwitchEnvironment from "@appsmith/components/SwitchEnvironment";
import { Container, Wrapper } from "./components";
import { useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { useDispatch } from "react-redux";
import { softRefreshActions } from "actions/pluginActionActions";
import { START_SWITCH_ENVIRONMENT } from "@appsmith/constants/messages";
import useShowEnvSwitcher from "@appsmith/hooks/useShowEnvSwitcher";

interface BottomBarProps {
  viewMode?: boolean;
}

export default function BottomBar({ viewMode = false }: BottomBarProps) {
  const isPreviewMode = useSelector(previewModeSelector);
  const showEnvSwitcher = useShowEnvSwitcher({ viewMode });
  const appId = useSelector(getCurrentApplicationId) || "";
  const dispatch = useDispatch();

  const onChangeEnv = () => {
    dispatch(softRefreshActions());
  };

  return (
    <Container>
      <Wrapper>
        {showEnvSwitcher && (
          <SwitchEnvironment
            editorId={appId}
            onChangeEnv={onChangeEnv}
            startSwitchEnvMessage={START_SWITCH_ENVIRONMENT}
            viewMode={viewMode}
          />
        )}
        {!viewMode && !isPreviewMode && <QuickGitActions />}
      </Wrapper>
      {!viewMode && !isPreviewMode && (
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
