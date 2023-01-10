import { debounce } from "lodash";
import React, {
  TextareaHTMLAttributes,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import styled from "styled-components";
import useComposedRef from "utils/UseComposeRef";

interface AutoResizeTextAreaStyledProps {
  autoResize: boolean;
}

type AutoResizeTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  AutoResizeTextAreaStyledProps;

const StyledTextArea = styled.textarea<AutoResizeTextAreaStyledProps>`
  padding: 10px;
  box-sizing: border-box;
  width: 100%;
  height: ${(props) => (!props.autoResize ? "100%" : "auto")};
  overflow: ${(props) => (!props.autoResize ? "unset" : "hidden")};
`;

const ProxyTextArea = styled(StyledTextArea)`
  position: absolute;
  height: auto;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  overflow: hidden;
  resize: none;
`;

function updateHeight<T extends HTMLElement | null>({
  autoResize,
  elementRef,
  proxyElementRef,
}: {
  autoResize: boolean;
  elementRef: React.MutableRefObject<T>;
  proxyElementRef: React.MutableRefObject<T>;
}) {
  if (autoResize) {
    const height = proxyElementRef.current?.scrollHeight;
    if (height) {
      if (elementRef.current !== null) {
        elementRef.current.style.height = `${height}px`;
      }
    }
  }
}

const AutoResizeTextArea: React.ForwardRefRenderFunction<
  HTMLTextAreaElement,
  AutoResizeTextAreaProps
> = (props, userRef) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const proxyTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const ref = useComposedRef(textAreaRef, userRef);

  const observer = React.useRef(
    new ResizeObserver(
      debounce(() => {
        updateHeight({
          autoResize: props.autoResize,
          proxyElementRef: proxyTextAreaRef,
          elementRef: textAreaRef,
        });
      }, 100),
    ),
  );

  useEffect(() => {
    if (proxyTextAreaRef.current) {
      observer.current.observe(proxyTextAreaRef.current);
    }

    return () => {
      if (proxyTextAreaRef.current) {
        observer.current.unobserve(proxyTextAreaRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    updateHeight({
      autoResize: props.autoResize,
      proxyElementRef: proxyTextAreaRef,
      elementRef: textAreaRef,
    });
  }, [props.value, props.autoResize]);

  return (
    <>
      <StyledTextArea {...props} ref={ref} />
      {// This is added to get the correct scroll height of a similar
      // textarea which is not displayed on the screen whose height
      // is always auto.
      props.autoResize ? (
        <ProxyTextArea
          autoResize={props.autoResize}
          readOnly
          ref={proxyTextAreaRef}
          value={props.value}
        />
      ) : null}
    </>
  );
};

export default React.forwardRef(AutoResizeTextArea);
