import { Button } from "@appsmith/ads";
import React from "react";

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
    <Button
      className="flex items-center justify-center text-center h-7 w-7 ml-auto"
      isDisabled={isUploadingNavigationLogo || isDeletingNavigationLogo}
      isIconButton
      kind="tertiary"
      onClick={() => handleDelete()}
      startIcon="trash"
    />
  );
};
