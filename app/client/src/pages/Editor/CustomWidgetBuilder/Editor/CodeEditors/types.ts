export interface ContentProps {
  height: number;
  width: string | number;
  showHeader?: boolean;
  onChange?: (value: React.ChangeEvent<string>) => void;
}
