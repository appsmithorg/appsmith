import type { EnvironmentType } from "@appsmith/configs/types";
import { PERMISSION_TYPE } from "../permissionHelpers";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import {
  ENV_WALKTHROUGH_A_BODY,
  ENV_WALKTHROUGH_A_FOOTER_BTN_TEXT,
  ENV_WALKTHROUGH_A_FOOTER_TEXT,
  ENV_WALKTHROUGH_A_TITLE,
  ENV_WALKTHROUGH_B_BODY,
  ENV_WALKTHROUGH_B_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import type { FeatureParams } from "components/featureWalkthrough/walkthroughContext";
import AnalyticsUtil from "utils/AnalyticsUtil";

export * from "ce/utils/Environments";

export const ENVIRONMENT_QUERY_KEY = "environment";

export const getFilteredEnvListWithPermissions = (
  envList: EnvironmentType[],
) => {
  return envList.filter(
    (env) =>
      env.userPermissions &&
      env.userPermissions.length > 0 &&
      env.userPermissions.includes(PERMISSION_TYPE.EXECUTE_ENVIRONMENT),
  );
};

export const dsEditorEnvWalkthroughConfig = (
  WALKTHROUGH_SECTION_ID: string,
  closeWalkthrough: () => void,
  imageURL: string,
): FeatureParams => ({
  targetId: `#${WALKTHROUGH_SECTION_ID}`,
  onDismiss: async () => {
    await closeWalkthrough();
  },
  details: {
    title: createMessage(ENV_WALKTHROUGH_B_TITLE),
    description: createMessage(ENV_WALKTHROUGH_B_BODY),
    imageURL,
  },
  offset: {
    position: "right",
    left: 25,
    top: 50,
  },
  eventParams: {
    [FEATURE_WALKTHROUGH_KEYS.env_walkthrough]: true,
    targetElement: "DS_EDITOR_ENVIRONMENT_FILTER",
    stepNumber: 2,
  },
  delay: 1500,
});

export const envSwitcherWalkthroughConfig = (
  WALKTHROUGH_SECTION_ID: string,
  closeWalkthrough: (setFlag?: boolean) => void,
  imageURL: string,
  createTempDatasource?: ({ pluginId }: { pluginId: string }) => void,
  postgresPluginId?: string,
): FeatureParams => ({
  targetId: `#${WALKTHROUGH_SECTION_ID}`,
  onDismiss: async () => {
    await closeWalkthrough();
  },
  details: {
    title: createMessage(ENV_WALKTHROUGH_A_TITLE),
    description: createMessage(ENV_WALKTHROUGH_A_BODY),
    imageURL,
    footerDetails: {
      footerText: createMessage(ENV_WALKTHROUGH_A_FOOTER_TEXT),
      footerButtonText: createMessage(ENV_WALKTHROUGH_A_FOOTER_BTN_TEXT),
      onClickHandler: () => {
        closeWalkthrough(false);
        AnalyticsUtil.logEvent("ENV_WALKTHROUGH_NEXT_CLICKED");
        createTempDatasource &&
          createTempDatasource({
            pluginId:
              !!postgresPluginId && postgresPluginId?.length > 0
                ? postgresPluginId
                : "",
          });
      },
    },
  },
  offset: {
    position: "right",
    highlightPad: 5,
    left: 10,
    top: -150,
  },
  eventParams: {
    [FEATURE_WALKTHROUGH_KEYS.env_walkthrough]: true,
    targetElement: "ENVIRONMENT_SWITCHER",
    stepNumber: 1,
  },
  delay: 2500,
});
