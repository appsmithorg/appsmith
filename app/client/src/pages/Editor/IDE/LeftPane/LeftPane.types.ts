export interface PaneHeaderProps {
  title: string;
  rightIcon?: React.ReactNode;
  className?: string;
}

export interface DataSidePaneProps {
  dsUsageSelector?: (...args: any[]) => Record<string, string>;
}
