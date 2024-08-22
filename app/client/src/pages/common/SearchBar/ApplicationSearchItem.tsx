import React from "react";

import type { ApplicationPayload } from "entities/Application";
import styled from "styled-components";
import { getApplicationIcon } from "utils/AppsmithUtils";

import { Text } from "@appsmith/ads";
import type { AppIconName } from "@appsmith/ads-old";
import { AppIcon, Size } from "@appsmith/ads-old";

import { SearchListItem } from "./WorkspaceSearchItems";

const CircleAppIcon = styled(AppIcon)`
  display: flex;
  align-items: center;
  svg {
    width: 16px;
    height: 16px;
    path {
      fill: var(--ads-v2-color-fg);
    }
  }
`;

interface Props {
  applicationsList: ApplicationPayload[] | undefined;
  navigateToApplication: (id: string) => void;
}

const ApplicationSearchItem = (props: Props) => {
  const { applicationsList, navigateToApplication } = props;
  if (!applicationsList || applicationsList?.length === 0) return null;
  return (
    <div className="mb-2">
      <Text className="!mb-2 !block" kind="body-s">
        Applications
      </Text>
      {applicationsList.map((application: ApplicationPayload) => (
        <SearchListItem
          data-testId={application.name}
          key={application.id}
          onClick={() => navigateToApplication(application.id)}
        >
          <CircleAppIcon
            className="!mr-1"
            name={
              (application?.icon ||
                getApplicationIcon(application.id)) as AppIconName
            }
            size={Size.xxs}
          />
          <Text className="truncate" kind="body-m">
            {application.name}
          </Text>
        </SearchListItem>
      ))}
    </div>
  );
};

export default ApplicationSearchItem;
