export * from "ce/hooks/importModal/useMethods";
import { importApplication } from "@appsmith/actions/applicationActions";
import { importPackage } from "@appsmith/actions/packageActions";
import {
  UPLOADING_APPLICATION,
  UPLOADING_PACKAGE,
  createMessage,
} from "@appsmith/constants/messages";
import { getIsImportingApplication } from "@appsmith/selectors/applicationSelectors";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { getIsImportingPackage } from "@appsmith/selectors/workspaceSelectors";
import type { UseMethodsProps } from "ce/hooks/importModal/useMethods";
import { default as useCEMethods } from "ce/hooks/importModal/useMethods";
import type { SetProgress } from "design-system-old";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const readAndParseFile = async (file: File) => {
  return new Promise<JSON>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const parsedJson: JSON = JSON.parse(e?.target?.result as string);
        resolve(parsedJson);
      } catch (e) {
        reject(new Error("Error parsing JSON file"));
      }
    };

    reader.onerror = (e: ProgressEvent<FileReader>) => {
      reject(new Error("FileReader error: " + e?.target?.error));
    };

    reader.readAsText(file);
  });
};

function useMethods(props: UseMethodsProps) {
  const { editorId, workspaceId } = props;
  const ce_methods = useCEMethods(props);
  const dispatch = useDispatch();
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);
  const showQueryModule = useSelector(getShowQueryModule);
  const [uploadingText, setUploadingText] = useState("");
  const importingApplication = useSelector(getIsImportingApplication);
  const importingPackage = useSelector(getIsImportingPackage);
  const isImporting = importingApplication || importingPackage;

  const fileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      try {
        if (!!file) {
          const fileData = await readAndParseFile(file);

          if ("exportedPackage" in fileData) {
            setUploadingText(createMessage(UPLOADING_PACKAGE));
            dispatch(
              importPackage({
                packageId: editorId,
                workspaceId: workspaceId || "",
                file,
              }),
            );
          } else {
            setUploadingText(createMessage(UPLOADING_APPLICATION));
            dispatch(
              importApplication({
                appId: editorId,
                workspaceId: workspaceId || "",
                applicationFile: file,
              }),
            );
          }

          setAppFileToBeUploaded({
            file,
            setProgress,
          });
        } else {
          setAppFileToBeUploaded(null);
        }
      } catch (e) {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  const resetAppFileToBeUploaded = useCallback(() => {
    setAppFileToBeUploaded(null);
  }, [setAppFileToBeUploaded]);

  if (!showQueryModule) {
    return ce_methods;
  }

  return {
    fileUploader,
    appFileToBeUploaded,
    resetAppFileToBeUploaded,
    uploadingText,
    isImporting,
  };
}

export default useMethods;
