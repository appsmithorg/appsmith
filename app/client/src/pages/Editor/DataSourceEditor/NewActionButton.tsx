import React, { useCallback, useContext, useEffect, useState } from "react";
import { PluginType } from "entities/Action";
import { Button, toast } from "design-system";
import {
  createMessage,
  ERROR_ADD_API_INVALID_URL,
  NEW_API_BUTTON_TEXT,
  NEW_QUERY_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import { createNewQueryAction } from "actions/apiPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { Datasource } from "entities/Datasource";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { noop } from "utils/AppsmithUtils";
import { getCurrentEnvironment } from "@appsmith/utils/Environments";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { getFeatureWalkthroughShown } from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { adaptiveSignpostingEnabled } from "@appsmith/selectors/featureFlagsSelectors";
import { actionsExistInCurrentPage } from "@appsmith/selectors/entitiesSelector";
import { SignpostingWalkthroughConfig } from "../FirstTimeUserOnboarding/Utils";

type NewActionButtonProps = {
  datasource?: Datasource;
  disabled?: boolean;
  packageName?: string;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
  pluginType?: string;
  style?: any;
  isNewQuerySecondaryButton?: boolean;
};
function NewActionButton(props: NewActionButtonProps) {
  const { datasource, disabled, isNewQuerySecondaryButton, pluginType } = props;
  const [isSelected, setIsSelected] = useState(false);

  const dispatch = useDispatch();
  const actionExist = useSelector(actionsExistInCurrentPage);
  const currentPageId = useSelector(getCurrentPageId);
  const currentEnvironment = getCurrentEnvironment();

  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const adapativeSignposting = useSelector(adaptiveSignpostingEnabled);
  const {
    isOpened: isWalkthroughOpened,
    popFeature,
    pushFeature,
  } = useContext(WalkthroughContext) || {};
  const closeWalkthrough = () => {
    if (isWalkthroughOpened && popFeature) {
      popFeature();
    }
  };
  useEffect(() => {
    if (adapativeSignposting && signpostingEnabled && !actionExist) {
      checkAndShowWalkthrough();
    }
  }, [actionExist, signpostingEnabled]);
  const checkAndShowWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.create_query,
    );
    !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature(SignpostingWalkthroughConfig.CREATE_A_QUERY);
  };

  const createQueryAction = useCallback(
    (e) => {
      e?.stopPropagation();
      if (
        pluginType === PluginType.API &&
        (!datasource ||
          !datasource.datasourceStorages[currentEnvironment]
            .datasourceConfiguration ||
          !datasource.datasourceStorages[currentEnvironment]
            .datasourceConfiguration.url)
      ) {
        toast.show(ERROR_ADD_API_INVALID_URL(), {
          kind: "error",
        });
        return;
      }

      // Close signposting walkthrough on click of create query button
      closeWalkthrough();

      if (currentPageId) {
        setIsSelected(true);
        if (datasource) {
          dispatch(
            createNewQueryAction(
              currentPageId,
              props.eventFrom as EventLocation,
              datasource?.id,
            ),
          );
        }
      }
    },
    [dispatch, currentPageId, datasource, pluginType, closeWalkthrough],
  );

  return (
    <Button
      className="t--create-query"
      id={"create-query"}
      isDisabled={!!disabled}
      isLoading={isSelected || props.isLoading}
      kind={isNewQuerySecondaryButton ? "secondary" : "primary"}
      onClick={disabled ? noop : createQueryAction}
      size="md"
      startIcon="plus"
    >
      {pluginType === PluginType.DB || pluginType === PluginType.SAAS
        ? createMessage(NEW_QUERY_BUTTON_TEXT)
        : createMessage(NEW_API_BUTTON_TEXT)}
    </Button>
  );
}

export default NewActionButton;
