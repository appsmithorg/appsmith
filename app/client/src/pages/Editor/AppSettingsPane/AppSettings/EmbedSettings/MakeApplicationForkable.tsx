import React from "react";
import { Switch } from "design-system-old";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import SwitchWrapper from "../../Components/SwitchWrapper";
import { useDispatch, useSelector } from "react-redux";
import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
import { updateApplication } from "@appsmith/actions/applicationActions";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";

const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
`;

function MakeApplicationForkable({
  application,
}: {
  application: ApplicationPayload | undefined;
}) {
  const dispatch = useDispatch();
  const isFetchingApplication = useSelector(getIsFetchingApplications);

  const onChangeInit = () => {
    onChangeConfirm();
  };

  const onChangeConfirm = () => {
    application &&
      dispatch(
        updateApplication(application?.id, {
          forkingEnabled: !application?.forkingEnabled,
          currentApp: true,
        }),
      );
  };

  return (
    <>
      <div className="px-4">
        <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)]">
          {createMessage(IN_APP_EMBED_SETTING.forkContentHeader)}
        </div>
      </div>
      <div className="px-4">
        <div className="flex justify-between items-center pb-4">
          <StyledPropertyHelpLabel
            label={createMessage(IN_APP_EMBED_SETTING.forkLabel)}
            lineHeight="1.17"
            maxWidth="270px"
            tooltip={createMessage(IN_APP_EMBED_SETTING.forkLabelTooltip)}
          />
          <SwitchWrapper>
            <Switch
              checked={!!application?.forkingEnabled}
              className="mb-0"
              data-cy="forking-enabled-toggle"
              disabled={isFetchingApplication}
              large
              onChange={onChangeInit}
            />
          </SwitchWrapper>
        </div>
      </div>
      <div
        className={`border-t-[1px] border-[color:var(--appsmith-color-black-300)]`}
      />
    </>
  );
}

export default MakeApplicationForkable;
