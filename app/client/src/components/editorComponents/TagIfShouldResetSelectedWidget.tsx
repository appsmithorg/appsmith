import React from "react";
import { useDispatch } from "react-redux";
import { setShouldResetWidget } from "actions/widgetActions";

type Props = {
  children: React.ReactNode;
};

const TagIfShouldResetSelectedWidgets = ({ children }: Props) => {
  const dispatch = useDispatch();
  return (
    <div
      onMouseDown={() => {
        dispatch(setShouldResetWidget(false));
      }}
    >
      {children}
    </div>
  );
};

export default TagIfShouldResetSelectedWidgets;
