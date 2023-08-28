export * from "ce/pages/Editor/NavigationSettings/DeleteLogoButton";
import {
  createMessage,
  LOGO_DIFFERENT_TOOLTIP,
  RESET_LOGO_TOOLTIP,
} from "@appsmith/constants/messages";
import { Button, Tooltip } from "design-system";
import { importSvg } from "design-system-old";
import React from "react";

const ResetIcon = importSvg(() => import("assets/icons/control/undo_2.svg"));

export const DeleteLogoButton = ({
  handleDelete,
  isDeletingNavigationLogo,
  isUploadingNavigationLogo,
}: {
  handleDelete: () => void;
  isDeletingNavigationLogo: boolean;
  isUploadingNavigationLogo: boolean;
}) => {
  return (
    <>
      <Tooltip content={createMessage(LOGO_DIFFERENT_TOOLTIP)}>
        <div className="ml-2 w-2 h-2 rounded-full bg-primary-500" />
      </Tooltip>

      <Tooltip content={createMessage(RESET_LOGO_TOOLTIP)} placement="topRight">
        <Button
          className="flex items-center justify-center text-center h-7 w-7 ml-auto"
          isDisabled={isUploadingNavigationLogo || isDeletingNavigationLogo}
          kind="tertiary"
          onClick={() => handleDelete()}
        >
          <ResetIcon className="w-5 h-5 cursor-pointer" />
        </Button>
      </Tooltip>
    </>
  );
};
