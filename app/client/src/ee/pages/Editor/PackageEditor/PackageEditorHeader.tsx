import React, { useState } from "react";
import { ThemeProvider } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { EditInteractionKind, SavingState } from "design-system-old";
import { Tooltip } from "design-system";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { EditorSaveIndicator } from "pages/Editor/EditorSaveIndicator";
import {
  createMessage,
  RENAME_PACKAGE_TOOLTIP,
} from "@appsmith/constants/messages";
import {
  getCurrentPackage,
  getIsSavingPackageName,
  getPackagesList,
  getisErrorSavingPackageName,
} from "@appsmith/selectors/packageSelectors";
import {
  HeaderSection,
  HeaderWrapper,
} from "pages/Editor/commons/EditorHeaderComponents";
import { LockEntityExplorer } from "pages/Editor/commons/LockEntityExplorer";
import { Omnibar } from "pages/Editor/commons/Omnibar";
import { HelperBarInHeader } from "pages/Editor/HelpBarInHeader";
import { AppsmithLink } from "pages/Editor/AppsmithLink";
import { updatePackageName } from "@appsmith/actions/packageActions";
import type { Package } from "@appsmith/constants/PackageConstants";
import EditorName from "pages/Editor/EditorName";
import { GetNavigationMenuData } from "./EditorPackageName/NavigationMenuData";

const theme = getTheme(ThemeMode.LIGHT);

export function PackageEditorHeader() {
  const dispatch = useDispatch();
  const isSavingName = useSelector(getIsSavingPackageName);
  const isErroredSavingName = useSelector(getisErrorSavingPackageName);
  const packageList = useSelector(getPackagesList) || [];
  const currentPackage = useSelector(getCurrentPackage);
  const packageId = currentPackage?.id;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const updatePackage = (val: string, pkg: Package | null) => {
    if (val !== pkg?.name) {
      dispatch(updatePackageName(val, pkg));
    }
  };

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
            content={createMessage(RENAME_PACKAGE_TOOLTIP)}
            isDisabled={isPopoverOpen}
            placement="bottom"
          >
            <div>
              <EditorName
                className="t--package-name editable-package-name max-w-48"
                defaultSavingState={
                  isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
                }
                defaultValue={currentPackage?.name || ""}
                editInteractionKind={EditInteractionKind.SINGLE}
                editorName="Package"
                fill
                getNavigationMenu={GetNavigationMenuData}
                isError={isErroredSavingName}
                isNewEditor={
                  packageList.filter((el) => el.id === packageId).length > 0 // ankita: update later, this is always true for package
                }
                isPopoverOpen={isPopoverOpen}
                onBlur={(value: string) => updatePackage(value, currentPackage)}
                setIsPopoverOpen={setIsPopoverOpen}
              />
            </div>
          </Tooltip>

          <EditorSaveIndicator
            isSaving={isSavingName}
            saveError={isErroredSavingName}
          />
        </HeaderSection>

        <HelperBarInHeader isPreview={false} />

        <HeaderSection />

        <Omnibar />
      </HeaderWrapper>
    </ThemeProvider>
  );
}

export default PackageEditorHeader;
