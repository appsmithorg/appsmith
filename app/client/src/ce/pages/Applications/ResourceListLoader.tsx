import React from "react";
import { noop } from "lodash";

import Card from "components/common/Card";
import CardList from "pages/Applications/CardList";
import { Button } from "design-system";
import { PaddingWrapper } from "pages/Applications/CommonElements";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";

interface ResourcesLoaderProps {
  isMobile: boolean;
  resources: ApplicationPayload[];
}

const DEFAULT_BACKGROUND_COLOR = "#9747FF1A";
const DEFAULT_ICON = "book";

function ResourceListLoader({ isMobile, resources }: ResourcesLoaderProps) {
  return (
    <CardList isLoading isMobile={isMobile} title="Apps">
      {resources.map((resource: any) => {
        return (
          <PaddingWrapper isMobile={isMobile} key={resource.id}>
            <Card
              backgroundColor={DEFAULT_BACKGROUND_COLOR}
              contextMenu={null}
              editedByText=""
              hasReadPermission
              icon={DEFAULT_ICON}
              isContextMenuOpen={false}
              isFetching
              isMobile={isMobile}
              moreActionItems={[]}
              primaryAction={noop}
              setShowOverlay={noop}
              showGitBadge={false}
              showOverlay={false}
              testId="t--package-card"
              title={resource.name}
              titleTestId="t--app-card-name"
            >
              <Button
                className="t--package-edit-link"
                href={"/"}
                size="md"
                startIcon={"pencil-line"}
              >
                Edit
              </Button>
            </Card>
          </PaddingWrapper>
        );
      })}
    </CardList>
  );
}

export default ResourceListLoader;
