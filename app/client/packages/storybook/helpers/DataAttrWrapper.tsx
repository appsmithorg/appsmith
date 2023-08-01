import React, { useEffect, useRef } from "react";

type DataAttrWrapperProps = {
  children: React.ReactNode;
  attr: string;
};

export const DataAttrWrapper = (props: DataAttrWrapperProps) => {
  const { attr, children } = props;

  const ref = useRef<any>(null);

  useEffect(() => {
    if (attr && ref?.current) {
      if (
        ref.current.setAttribute &&
        typeof ref.current.setAttribute === "function"
      ) {
        ref.current.setAttribute(attr, "");

        return;
      }

      if (typeof ref.current.UNSAFE_getDOMNode === "function") {
        const domNode = ref.current.UNSAFE_getDOMNode();

        if (domNode) domNode.setAttribute(attr, "");

        return;
      }
    }
  }, [attr, ref.current]);

  return React.cloneElement(children as React.ReactElement, { ref });
};
