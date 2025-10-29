import React from "react";
import { useSelector } from "react-redux";
import { IDEHeader, IDEHeaderTitle, Link } from "@appsmith/ads";
import { APPLICATIONS_URL } from "constants/routes";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { AppsmithLink } from "pages/Editor/AppsmithLink";
import styled from "styled-components";

const StyledWorkspaceHeader = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--ads-v2-z-index-9);
  background: var(--ads-v2-color-bg);
`;

const WorkspaceDatasourceHeader = () => {
  const currentWorkspace = useSelector(getCurrentAppWorkspace);

  return (
    <StyledWorkspaceHeader>
      <IDEHeader>
        <IDEHeader.Left logo={<AppsmithLink />}>
          <IDEHeaderTitle title="Datasources" />
        </IDEHeader.Left>
        <IDEHeader.Center>
          {currentWorkspace?.name && (
            <Link className="mr-1.5" to={APPLICATIONS_URL}>
              {currentWorkspace.name}
            </Link>
          )}
        </IDEHeader.Center>
        <IDEHeader.Right>
          <div />
        </IDEHeader.Right>
      </IDEHeader>
    </StyledWorkspaceHeader>
  );
};

export default WorkspaceDatasourceHeader;
