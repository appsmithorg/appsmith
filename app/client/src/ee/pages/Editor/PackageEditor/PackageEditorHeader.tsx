import React, { useState } from "react";
import { ThemeProvider } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { EditInteractionKind, SavingState } from "design-system-old";
import { Button, Tooltip } from "design-system";
import { getTheme, ThemeMode } from "selectors/themeSelectors";
import { EditorSaveIndicator } from "pages/Editor/EditorSaveIndicator";
import {
  createMessage,
  RENAME_PACKAGE_TOOLTIP,
} from "@appsmith/constants/messages";
import {
  getCurrentPackage,
  getIsPackagePublishing,
  getIsSavingPackageName,
  getPackagesList,
  getisErrorSavingPackageName,
} from "@appsmith/selectors/packageSelectors";
import {
  HeaderSection,
  HeaderWrapper,
} from "pages/Editor/commons/EditorHeaderComponents";
import { AppsmithLink } from "pages/Editor/AppsmithLink";
import {
  publishPackage,
  updatePackage,
} from "@appsmith/actions/packageActions";
import type { Package } from "@appsmith/constants/PackageConstants";
import EditorName from "pages/Editor/EditorName";
import { GetNavigationMenuData } from "./EditorPackageName/NavigationMenuData";
import { getIsModuleSaving } from "@appsmith/selectors/modulesSelector";

const theme = getTheme(ThemeMode.LIGHT);

export function PackageEditorHeader() {
  const dispatch = useDispatch();
  const isSavingName = useSelector(getIsSavingPackageName);
  const isModuleSaving = useSelector(getIsModuleSaving);
  const isErroredSavingName = useSelector(getisErrorSavingPackageName);
  const packageList = useSelector(getPackagesList) || [];
  const isPublishing = useSelector(getIsPackagePublishing);
  const currentPackage = useSelector(getCurrentPackage);
  const packageId = currentPackage?.id || "";
  const isSaving = isSavingName || isModuleSaving;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const onUpdatePackage = (val: string, pkg: Package | null) => {
    if (val !== pkg?.name) {
      dispatch(
        updatePackage({
          name: val,
          id: pkg?.id || packageId,
        }),
      );
    }
  };

  const onPublishPackage = () => {
    if (packageId) {
      dispatch(publishPackage({ packageId }));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <HeaderWrapper
        className="pl-1 pr-1 overflow-hidden"
        data-testid="t--appsmith-package-editor-header"
      >
        <HeaderSection className="space-x-2">
          <div />

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
                onBlur={(value: string) =>
                  onUpdatePackage(value, currentPackage)
                }
                setIsPopoverOpen={setIsPopoverOpen}
              />
            </div>
          </Tooltip>

          <EditorSaveIndicator
            isSaving={isSaving}
            saveError={isErroredSavingName}
          />
        </HeaderSection>

        <HeaderSection />

        <HeaderSection className="gap-x-1">
          <div className="flex items-center">
            <Button
              data-testid="t--package-publish-btn"
              isLoading={isPublishing}
              kind="tertiary"
              onClick={onPublishPackage}
              size="md"
              startIcon={"rocket"}
            >
              Publish
            </Button>
          </div>
        </HeaderSection>
      </HeaderWrapper>
    </ThemeProvider>
  );
}

export default PackageEditorHeader;
