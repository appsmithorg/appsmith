import { isValidElement, forwardRef, cloneElement } from "react";
import { useMergeRefs } from "@floating-ui/react";
import { usePopoverContext } from "./PopoverContext";

import type { ButtonProps } from "../../Button";
import type { AriaAttributes, Ref } from "react";
import type { PopoverTriggerProps } from "./types";

const _PopoverTrigger = (
  props: PopoverTriggerProps,
  propRef: Ref<HTMLElement>,
) => {
  const { children } = props;
  const context = usePopoverContext();
  // @ts-expect-error we don't know which type children will be
  const childrenRef = (children as unknown).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  if (isValidElement(children)) {
    const referenceProps = context.getReferenceProps({
      ref,
      ...props,
    });

    return cloneElement(children, {
      onPress: () => {
        context.setOpen(!context.open);
      },
      "aria-controls": referenceProps[
        "aria-controls"
      ] as AriaAttributes["aria-controls"],
      "aria-expanded": referenceProps[
        "aria-expanded"
      ] as AriaAttributes["aria-expanded"],
      "aria-haspopup": referenceProps[
        "aria-haspopup"
      ] as AriaAttributes["aria-haspopup"],
      ref,
      ...children.props,
    } as ButtonProps);
  }

  throw new Error("PopoverTrigger children component must be <Button />");
};

export const PopoverTrigger = forwardRef(_PopoverTrigger);
