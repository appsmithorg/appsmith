import React from "react";
import styled from "styled-components";
import { Button, Link } from "design-system";

import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import ModuleInstanceNameEditor from "./ModuleInstanceNameEditor";
import { useHistory } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { builderURL, moduleEditorURL } from "@appsmith/RouteBuilder";
import type { AppsmithLocationState } from "utils/history";
import EditorContextMenu from "./EditorContextMenu";
import { deleteModuleInstance } from "@appsmith/actions/moduleInstanceActions";
import { hasDeleteModuleInstancePermission } from "@appsmith/utils/permissionHelpers";
import { GO_TO_MODULE, createMessage } from "@appsmith/constants/messages";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";

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
  packageId?: string;
  moduleId?: string;
  children: React.ReactNode;
}

function Header({
  children,
  moduleId,
  moduleInstance,
  packageId,
}: HeaderProps) {
  const history = useHistory<AppsmithLocationState>();
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const onBack = () => {
    history.push(builderURL({ pageId }));
  };

  const onDelete = () => {
    dispatch(deleteModuleInstance({ id: moduleInstance.id }));
  };

  const onGoToModuleClick = () => {
    urlBuilder.setPackageParams({ packageId });
    const url = moduleEditorURL({ moduleId });
    history.push(url);
  };

  const isDeletePermitted = hasDeleteModuleInstancePermission(
    moduleInstance?.userPermissions,
  );

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
          <EditorContextMenu
            isDeletePermitted={isDeletePermitted}
            onDelete={onDelete}
          />
          {moduleId && packageId && (
            <Button kind="secondary" onClick={onGoToModuleClick} size="md">
              {createMessage(GO_TO_MODULE)}
            </Button>
          )}
          {children}
        </StyledSubheaderSection>
      </StyledSubheader>
    </StyledContainer>
  );
}

export default Header;
