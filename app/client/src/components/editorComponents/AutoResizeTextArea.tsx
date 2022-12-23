import React, {
  MutableRefObject,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
} from "react";
import styled from "styled-components";

type AutoResizeTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const PADDING = 10;

const StyledTextArea = styled.textarea`
  padding: ${PADDING}px;
  box-sizing: border-box;
  width: 100%;
`;

const TextAreaContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const TextAreaMask = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  background: black;
  width: 100%;
  height: auto;
  pointer-events: none;
  color: white;
  padding: 10px;
  word-break: break-all;
  white-space: break-spaces;
  visibility: hidden;
  opacity: 0;
`;

const AutoResizeTextArea: React.ForwardRefRenderFunction<
  HTMLTextAreaElement,
  AutoResizeTextAreaProps
> = (props, ref) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    props.onChange && props.onChange(e);
  };

  function assignRef(element: HTMLTextAreaElement) {
    if (ref) {
      (ref as MutableRefObject<HTMLTextAreaElement>).current = element;
    }
    textAreaRef.current = element;
  }

  const observerRef = useRef(
    new ResizeObserver((entries) => {
      const height = Math.max(50, entries[0].contentRect.height);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      textAreaRef.current!.style.height = `${height + 2 * PADDING}px`;
    }),
  );

  useEffect(() => {
    if (maskRef.current !== null) {
      observerRef.current.observe(maskRef.current);
    }

    return () => {
      if (maskRef.current !== null) {
        observerRef.current.unobserve(maskRef.current);
      }
    };
  }, []);

  return (
    <TextAreaContainer>
      <StyledTextArea {...props} onChange={handleChange} ref={assignRef} />
      <TextAreaMask ref={maskRef}>{props.value}</TextAreaMask>
    </TextAreaContainer>
  );
};

export default React.forwardRef(AutoResizeTextArea);
