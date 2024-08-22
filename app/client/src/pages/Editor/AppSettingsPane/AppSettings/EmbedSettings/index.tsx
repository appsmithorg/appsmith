import React from "react";

import { changeAppViewAccessInit } from "ee/actions/applicationActions";
import {
  IN_APP_EMBED_SETTING,
  MAKE_APPLICATION_PUBLIC,
  MAKE_APPLICATION_PUBLIC_TOOLTIP,
  createMessage,
} from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getCurrentApplication,
  getIsChangingViewAccess,
} from "ee/selectors/applicationSelectors";
import { getIsFetchingApplications } from "ee/selectors/selectedWorkspaceSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getEmbedSnippetTab } from "ee/utils/BusinessFeatures/privateEmbedHelpers";
import { PERMISSION_TYPE, isPermitted } from "ee/utils/permissionHelpers";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { Divider, Switch } from "@appsmith/ads";

import MakeApplicationForkable from "./MakeApplicationForkable";

const StyledPropertyHelpLabel = styled(PropertyHelpLabel)`
  .bp3-popover-content > div {
    text-align: center;
    max-height: 44px;
    display: flex;
    align-items: center;
  }
`;

const Title = styled.p`
  font-size: var(--ads-v2-font-size-4);
  line-height: 1.2rem;
  font-weight: var(--ads-v2-font-weight-bold);
  color: var(--ads-v2-color-fg-emphasis);
`;

function EmbedSettings() {
  const application = useSelector(getCurrentApplication);
  const dispatch = useDispatch();
  const isChangingViewAccess = useSelector(getIsChangingViewAccess);
  const isFetchingApplication = useSelector(getIsFetchingApplications);
  const userAppPermissions = application?.userPermissions ?? [];
  const isPrivateEmbedEnabled = useFeatureFlag(
    FEATURE_FLAG.license_private_embeds_enabled,
  );
  const canShareWithPublic = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.MAKE_PUBLIC_APPLICATION,
  );
  const canMarkAppForkable = isPermitted(
    userAppPermissions,
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );

  return (
    <div>
      {canShareWithPublic && (
        <>
          <div className="px-4 mt-4 mb-3">
            <Title>
              {createMessage(IN_APP_EMBED_SETTING.sectionContentHeader)}
            </Title>
          </div>
          <div className="px-4">
            <div className="flex justify-between content-center">
              <Switch
                data-testid="t--embed-settings-application-public"
                isDisabled={isFetchingApplication || isChangingViewAccess}
                isSelected={application?.isPublic}
                onChange={() => {
                  AnalyticsUtil.logEvent("MAKE_APPLICATION_PUBLIC", {
                    isPublic: !application?.isPublic,
                  });
                  application &&
                    dispatch(
                      changeAppViewAccessInit(
                        application?.id,
                        !application?.isPublic,
                      ),
                    );
                }}
              >
                <StyledPropertyHelpLabel
                  label={createMessage(MAKE_APPLICATION_PUBLIC)}
                  lineHeight="1.17"
                  maxWidth="270px"
                  tooltip={createMessage(MAKE_APPLICATION_PUBLIC_TOOLTIP)}
                />
              </Switch>
            </div>
          </div>
          <Divider />
        </>
      )}

      {canMarkAppForkable && (
        <MakeApplicationForkable application={application} />
      )}
      {getEmbedSnippetTab(isPrivateEmbedEnabled)}
    </div>
  );
}

export default EmbedSettings;
