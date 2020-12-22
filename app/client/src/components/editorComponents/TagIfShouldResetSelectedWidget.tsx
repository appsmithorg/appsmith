import React from "react";

type Props = {
  children: React.ReactNode;
};

const tagEvent = (e: any) => (e.nativeEvent.shouldNotResetWidget = true);

const TagIfShouldResetSelectedWidgets = ({ children }: Props) => {
  return <div onMouseDown={tagEvent}>{children}</div>;
};

export default TagIfShouldResetSelectedWidgets;
