import { CommonComponentProps } from "./common";
// import { RadioOption } from '@appsmith/widgets/RadioGroupWidget';

export interface RadioOption {
  label: string;
  value: string;
  id: string;
}

type RadioProps = CommonComponentProps & {
  align?: "horizontal" | "vertical" | "column" | "row";
  columns?: number;
  rows?: number;
  value?: string;
  onChange: (option: RadioOption) => void;
};

export default function RadioGroup(props: RadioProps) {
  return "";
}
