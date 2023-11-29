import React from "react";
import { Flex, Text, Button } from "design-system";
import { importSvg } from "design-system-old";

import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useDispatch, useSelector } from "react-redux";
import { createNewJSCollection } from "../../../actions/jsPaneActions";

const JSBlankState = () => {
  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const BlankStateIllustration = importSvg(
    async () => import("assets/images/no-js-min.svg"),
  );
  const dispatch = useDispatch();

  const pageId = useSelector(getCurrentPageId);

  return (
    <Flex
      alignItems={"center"}
      flexDirection={"column"}
      gap={"spaces-7"}
      height={"100%"}
      justifyContent={"center"}
      width={"100%"}
    >
      <BlankStateIllustration />
      <Text color={"var(--ads-v2-color-fg)"} kind={"heading-xs"}>
        {createMessage(PAGES_PANE_TEXTS.js_blank_state)}
      </Text>
      {canCreateActions && (
        <Button
          onClick={() =>
            dispatch(
              createNewJSCollection(pageId, "JS_OBJECT_GUTTER_RUN_BUTTON"),
            )
          }
          size={"md"}
          startIcon={"add-line"}
        >
          {createMessage(PAGES_PANE_TEXTS.js_blank_button)}
        </Button>
      )}
    </Flex>
  );
};

export { JSBlankState };
