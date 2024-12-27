import type { SegmentedControlOption } from "../../../SegmentedControl";

export interface EditorSegmentsProps {
  selectedSegment: string;
  onSegmentChange: (value: string) => void;
  options: SegmentedControlOption[];
  children?: React.ReactNode | React.ReactNode[];
}
