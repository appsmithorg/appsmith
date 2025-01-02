interface RagDocumentsProps {
  datasourceId?: string;
  workspaceId?: string;
  isDeletedAvailable?: boolean;
  isImportDataAvailable?: boolean;
  setCount?: (count: number) => void;
}

// Used in EE
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const RagDocuments = (props: RagDocumentsProps) => {
  return null;
};
