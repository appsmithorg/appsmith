import React from "react";
import { Container, Wrapper } from "components/BottomBar/components";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import SwitchEnvironment from "@appsmith/components/SwitchEnvironment";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { useDispatch, useSelector } from "react-redux";
import { softRefreshModules } from "@appsmith/actions/moduleActions";
import { START_SWITCH_ENVIRONMENT_FOR_PACKAGE } from "@appsmith/constants/messages";

export default function BottomBar() {
  const packageId = useSelector(getCurrentPackageId) || "";
  const dispatch = useDispatch();

  const onChangeEnv = () => {
    dispatch(softRefreshModules());
  };

  return (
    <Container>
      <Wrapper>
        <SwitchEnvironment
          editorId={packageId}
          onChangeEnv={onChangeEnv}
          startSwitchEnvMessage={START_SWITCH_ENVIRONMENT_FOR_PACKAGE}
          viewMode={false}
        />
      </Wrapper>
      <Wrapper>
        <DebuggerTrigger />
        <div data-testid="t--help-button" />
      </Wrapper>
    </Container>
  );
}
