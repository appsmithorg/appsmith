import React, {
  MutableRefObject,
  TextareaHTMLAttributes,
  useLayoutEffect,
  useRef,
} from "react";
import styled from "styled-components";

interface AutoResizeTextAreaStyledProps {
  autoResize: boolean;
}

type AutoResizeTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  AutoResizeTextAreaStyledProps;

const PADDING = 10;

const StyledTextArea = styled.textarea<AutoResizeTextAreaStyledProps>`
  padding: ${PADDING}px;
  box-sizing: border-box;
  width: 100%;
  height: ${(props) => (!props.autoResize ? "100%" : "auto")};
`;

const ProxyTextArea = styled(StyledTextArea)`
  position: absolute;
  height: auto;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
`;

const AutoResizeTextArea: React.ForwardRefRenderFunction<
  HTMLTextAreaElement,
  AutoResizeTextAreaProps
> = (props, ref) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const proxyTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    if (props.autoResize) {
      const height = proxyTextAreaRef.current?.scrollHeight;
      if (height) {
        if (textAreaRef.current !== null) {
          textAreaRef.current.style.height = `${height}px`;
        }
      }
    }
  }, [props.value, props.autoResize]);

  function assignRef(element: HTMLTextAreaElement) {
    try {
      const mutableForwardRef = ref as MutableRefObject<HTMLTextAreaElement>;
      if (mutableForwardRef) {
        mutableForwardRef.current = element;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    textAreaRef.current = element;
  }

  return (
    <>
      <StyledTextArea {...props} ref={assignRef} />
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
