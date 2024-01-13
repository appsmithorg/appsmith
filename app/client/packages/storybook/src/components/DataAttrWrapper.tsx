import React, { useEffect, useRef } from "react";

interface DataAttrWrapperProps {
  children: React.ReactNode;
  attr: string;
}

export const DataAttrWrapper = (props: DataAttrWrapperProps) => {
  const { attr, children } = props;

  // Adding any type here because WDS components has different types for ref
  // some are HTMLElement and some are objects only ( For e.g - CheckboxRef )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useEffect(() => {
    if (attr && Boolean(ref?.current)) {
      if (
        Boolean(ref.current.setAttribute) &&
        typeof ref.current.setAttribute === "function"
      ) {
        ref.current.setAttribute(attr, "");

        return;
      }

      if (typeof ref.current.UNSAFE_getDOMNode === "function") {
        const domNode = ref.current.UNSAFE_getDOMNode();

        if (Boolean(domNode)) domNode.setAttribute(attr, "");

        return;
      }
    }
  }, [attr, ref.current]);

  return React.cloneElement(children as React.ReactElement, { ref });
};
