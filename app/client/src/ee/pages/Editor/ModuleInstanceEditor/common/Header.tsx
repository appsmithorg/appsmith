import React from "react";
import styled from "styled-components";
import { Button, Link } from "design-system";

import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import ModuleInstanceNameEditor from "./ModuleInstanceNameEditor";
import { useHistory } from "react-router";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { builderURL } from "@appsmith/RouteBuilder";
import type { AppsmithLocationState } from "utils/history";
import EditorContextMenu from "./EditorContextMenu";
import { noop } from "lodash";

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--ads-v2-color-gray-0);
  border-bottom: 1px solid var(--ads-v2-color-gray-300);
  padding: var(--ads-v2-spaces-6);
  gap: var(--ads-v2-spaces-4);
`;

const StyledSubheader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StyledSubheaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
`;

const StyledBackLink = styled(Link)`
  margin-bottom: var(--ads-v2-spaces-4);
`;

interface HeaderProps {
  moduleInstance: ModuleInstance;
}

function Header({ moduleInstance }: HeaderProps) {
  const history = useHistory<AppsmithLocationState>();
  const pageId = useSelector(getCurrentPageId);
  const onBack = () => {
    history.push(builderURL({ pageId }));
  };

  return (
    <StyledContainer>
      <StyledBackLink
        className="t--admin-settings-back-button"
        kind="secondary"
        onClick={onBack}
        startIcon="back-control"
      >
        Back
      </StyledBackLink>
      <StyledSubheader>
        <StyledSubheaderSection>
          <ModuleInstanceNameEditor moduleInstance={moduleInstance} />
        </StyledSubheaderSection>
        <StyledSubheaderSection>
          <EditorContextMenu isDeletePermitted onDelete={noop} />
          <Button
            className="t--run-module-instance"
            data-guided-tour-iid="run-module-instance"
            // isDisabled={blockExecution}
            // isLoading={isRunning}
            // onClick={onRunClick}
            size="md"
          >
            Run
          </Button>
        </StyledSubheaderSection>
      </StyledSubheader>
    </StyledContainer>
  );
}

export default Header;
