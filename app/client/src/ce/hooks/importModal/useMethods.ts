import { importApplication } from "ee/actions/applicationActions";
import { UPLOADING_APPLICATION, createMessage } from "ee/constants/messages";
import { getIsImportingApplication } from "ee/selectors/applicationSelectors";
import type { SetProgress } from "@appsmith/ads-old";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export interface UseMethodsProps {
  editorId?: string;
  workspaceId?: string;
}

/**
 * This function is extended in EE so tread cautiously when modifying anything
 */
function useMethods({ editorId, workspaceId }: UseMethodsProps) {
  const dispatch = useDispatch();
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);
  const importingApplication = useSelector(getIsImportingApplication);

  const fileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        dispatch(
          importApplication({
            appId: editorId,
            workspaceId: workspaceId || "",
            applicationFile: file,
          }),
        );
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
      } else {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  const resetAppFileToBeUploaded = useCallback(() => {
    setAppFileToBeUploaded(null);
  }, [setAppFileToBeUploaded]);

  return {
    fileUploader,
    appFileToBeUploaded,
    resetAppFileToBeUploaded,
    uploadingText: createMessage(UPLOADING_APPLICATION),
    isImporting: importingApplication,
  };
}

export default useMethods;
