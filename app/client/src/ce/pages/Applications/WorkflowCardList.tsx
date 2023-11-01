import type { Package } from "@appsmith/constants/PackageConstants";

export interface WorkflowCardListProps {
  isMobile: boolean;
  workspaceId: string;
  workflows?: Package[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WorkflowCardList(props: WorkflowCardListProps) {
  return null;
}

export default WorkflowCardList;
