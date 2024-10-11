import React from "react";
import { noop } from "lodash";

import Card from "components/common/Card";
import CardList from "pages/Applications/CardList";
import { Button } from "@appsmith/ads";
import { PaddingWrapper } from "pages/Applications/CommonElements";
import type { ApplicationPayload } from "entities/Application";

interface ResourcesLoaderProps {
  isMobile: boolean;
  resources: ApplicationPayload[];
}

const DEFAULT_BACKGROUND_COLOR = "#9747FF1A";
const DEFAULT_ICON = "book";
const DEAFULT_RESOURCES = [{ id: "default", name: "Default Resource" }];

function ResourceListLoader({ isMobile, resources }: ResourcesLoaderProps) {
  const resourcesToUse = resources?.length ? resources : DEAFULT_RESOURCES;

  return (
    <CardList isLoading isMobile={isMobile} title="Apps">
      {/* TODO: Fix this the next time the file is edited */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {resourcesToUse.map((resource: any) => {
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
