import type { ChangeEvent, ReactNode } from "react";

export interface EditableTextProps {
  contentEditable?: boolean;
  onBlur?: (event: ChangeEvent<HTMLDivElement>) => void;
  children: ReactNode;
}
