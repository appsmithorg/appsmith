import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { Text } from "design-system";
import React from "react";
import { SearchListItem } from "./WorkspaceSearchItems";
import styled from "styled-components";
import type { AppIconName } from "design-system-old";
import { AppIcon, Size } from "design-system-old";
import { getApplicationIcon } from "utils/AppsmithUtils";

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
            color="var(--ads-v2-color-fg)"
            name={
              application?.icon ||
              (getApplicationIcon(application.id) as AppIconName)
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
