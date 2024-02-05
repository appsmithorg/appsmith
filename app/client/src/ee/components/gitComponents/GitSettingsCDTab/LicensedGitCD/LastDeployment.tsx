import { setShowDisableCDModalAction } from "@appsmith/actions/gitExtendedActions";
import {
  createMessage,
  GIT_CD_DISABLE_CD,
  GIT_CD_LAST_DEPLOYMENT,
} from "@appsmith/constants/messages";
import { setGitSettingsModalOpenAction } from "actions/gitSyncActions";
import { Button, Icon, Text } from "design-system";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getApplicationLastDeployedAt } from "selectors/editorSelectors";
import { getDefaultGitBranchName } from "selectors/gitSyncSelectors";
import { howMuchTimeBeforeText } from "utils/helpers";

function LastDeployment() {
  const lastDeployedAt = useSelector(getApplicationLastDeployedAt);
  const defaultBranchName = useSelector(getDefaultGitBranchName);
  const dispatch = useDispatch();
  const handleDisableCD = () => {
    dispatch(setGitSettingsModalOpenAction({ open: false }));
    dispatch(setShowDisableCDModalAction(true));
  };

  const lastDeployedAtMsg = lastDeployedAt
    ? `${howMuchTimeBeforeText(lastDeployedAt, {
        lessThanAMinute: true,
      })} ago`
    : "";

  return (
    <div className="flex items-center">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <Icon className="mr-2" name="git-commit" size={16} />
          <Text className="!font-semibold" kind="heading-s" renderAs="h3">
            {createMessage(GIT_CD_LAST_DEPLOYMENT)}
          </Text>
        </div>
        {lastDeployedAt && (
          <Text renderAs="p">
            {lastDeployedAtMsg} | {defaultBranchName}
          </Text>
        )}
      </div>
      <div className="shrink-0">
        <Button kind="error" onClick={handleDisableCD} size="md">
          {createMessage(GIT_CD_DISABLE_CD)}
        </Button>
      </div>
    </div>
  );
}

export default LastDeployment;
