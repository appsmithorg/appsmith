import React, { useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { previewModeSelector } from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { useDispatch, useSelector } from "react-redux";
import { updateApplication } from "@appsmith/actions/applicationActions";
import {
  getApplicationList,
  getIsSavingAppName,
  getIsErroredSavingAppName,
  getCurrentApplication,
} from "@appsmith/selectors/applicationSelectors";
import EditorAppName from "pages/Editor/EditorAppName";
import { EditInteractionKind, SavingState } from "design-system-old";
import { Tooltip } from "design-system";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { EditorSaveIndicator } from "pages/Editor/EditorSaveIndicator";
import { fetchUsersForWorkspace } from "@appsmith/actions/workspaceActions";

import {
  createMessage,
  RENAME_APPLICATION_TOOLTIP,
} from "@appsmith/constants/messages";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import {
  HeaderSection,
  HeaderWrapper,
} from "pages/Editor/commons/EditorHeaderComponents";
import { LockEntityExplorer } from "pages/Editor/commons/LockEntityExplorer";
import { Omnibar } from "pages/Editor/commons/Omnibar";
import { HelperBarInHeader } from "pages/Editor/HelpBarInHeader";
import { AppsmithLink } from "pages/Editor/AppsmithLink";

const theme = getTheme(ThemeMode.LIGHT);

export function PackageEditorHeader() {
  const dispatch = useDispatch();
  const isSavingName = useSelector(getIsSavingAppName);
  const isErroredSavingName = useSelector(getIsErroredSavingAppName);
  const applicationList = useSelector(getApplicationList);
  const isPreviewMode = useSelector(previewModeSelector);
  const workspaceId = useSelector(getCurrentWorkspaceId);
  const packageId = useSelector(getCurrentPackageId);
  const currentApplication = useSelector(getCurrentApplication);

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const updateApplicationDispatch = (
    id: string,
    data: { name: string; currentApp: boolean },
  ) => {
    dispatch(updateApplication(id, data));
  };

  //Fetch all users for the application to show the share button tooltip
  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchUsersForWorkspace(workspaceId));
    }
  }, [workspaceId]);

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper
        className="pl-1 pr-1 overflow-hidden"
        data-testid="t--appsmith-package-editor-header"
      >
        <HeaderSection className="space-x-2">
          <LockEntityExplorer />

          <AppsmithLink />

          <Tooltip
            content={createMessage(RENAME_APPLICATION_TOOLTIP)}
            isDisabled={isPopoverOpen}
            placement="bottom"
          >
            <div>
              <EditorAppName
                applicationId={packageId}
                className="t--application-name editable-application-name max-w-48"
                defaultSavingState={
                  isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
                }
                defaultValue={currentApplication?.name || ""}
                editInteractionKind={EditInteractionKind.SINGLE}
                fill
                isError={isErroredSavingName}
                isNewApp={
                  applicationList.filter((el) => el.id === packageId).length > 0
                }
                isPopoverOpen={isPopoverOpen}
                onBlur={(value: string) =>
                  updateApplicationDispatch(packageId || "", {
                    name: value,
                    currentApp: true,
                  })
                }
                setIsPopoverOpen={setIsPopoverOpen}
              />
            </div>
          </Tooltip>

          <EditorSaveIndicator />
        </HeaderSection>

        <HelperBarInHeader isPreviewMode={isPreviewMode} />

        <HeaderSection />

        <Omnibar />
      </HeaderWrapper>
    </ThemeProvider>
  );
}

export default PackageEditorHeader;
