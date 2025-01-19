import type { SidebarButtonProps } from "./SidebarButton/SidebarButton.types";

// Sidebar handles the correct handling of sidebar button. It will check if
// the button should be selected and only handle calling the onClick
export interface IDESidebarButton
  extends Omit<SidebarButtonProps, "onClick" | "selected"> {
  state: string;
  urlSuffix: string;
}

export interface IDESidebarProps {
  id?: string;
  topButtons: IDESidebarButton[];
  bottomButtons: IDESidebarButton[];
  editorState: string;
  onClick: (suffix: string) => void;
}
