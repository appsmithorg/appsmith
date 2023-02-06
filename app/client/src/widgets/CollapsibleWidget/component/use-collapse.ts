import {
  useEffect,
  useState,
  CSSProperties,
  MouseEvent,
  useRef,
  TransitionEvent,
} from "react";
import { flushSync } from "react-dom";

import { callAll, getElementHeight, noop } from "./utils";

const easing = "cubic-bezier(0.4, 0, 0.2, 1)";

const duration = 266;

const collapsedStyles = {
  display: "none",
  height: "0px",
  overflow: "hidden",
};

type UseCollapseInput = {
  /** default state of the collapsible */
  isOpened?: boolean;
  /** triggered when the component is closing  */
  onCollapseStart?: () => void;
  /** triggered after the component is closed */
  onCollapseEnd?: () => void;
  /** triggered when the component is opening  */
  onExpandStart?: () => void;
  /** triggered after the component is opened */
  onExpandEnd?: () => void;
  /** triggered on open and close */
  onToggle?: () => void;
};

export function useCollapse({
  isOpened = false,
  onExpandStart = noop,
  onExpandEnd = noop,
  onCollapseStart = noop,
  onCollapseEnd = noop,
  onToggle = noop,
}: UseCollapseInput = {}) {
  const [isExpanded, setExpanded] = useState(isOpened);

  const [collapsibleStyles, setStylesRaw] = useState<CSSProperties>(
    isOpened ? {} : collapsedStyles,
  );

  const containerRef = useRef<HTMLElement | null>(null);

  const mounted = useRef<boolean>(false);

  useEffect(() => {
    if (mounted.current) {
      expandCollapse(isOpened);
    }
    mounted.current = true;
  }, [isOpened]);

  // eslint-disable-next-line @typescript-eslint/ban-types
  const setStyles = (newStyles: {} | ((oldStyles: {}) => {})) => {
    flushSync(() => {
      setStylesRaw(newStyles);
    });
  };

  const mergeStyles = (newStyles: Record<string, unknown>) => {
    setStyles((oldStyles) => ({ ...oldStyles, ...newStyles }));
  };

  const handleTransitionEnd = (e: React.TransitionEvent): void => {
    if (e.target !== containerRef.current || e.propertyName !== "height") {
      return;
    }

    if (isExpanded) {
      const height = getElementHeight(containerRef);

      // If the height at the end of the transition
      // matches the height we're animating to,
      if (height === collapsibleStyles.height) {
        setStyles({});
      } else {
        // If the heights don't match, this could be due the height of the content changing mid-transition
        mergeStyles({ height });
      }

      onExpandEnd();
    }

    onCollapseEnd();
  };

  function expandCollapse(nextState: boolean) {
    setExpanded(nextState);
    if (nextState) {
      requestAnimationFrame(() => {
        onExpandStart();
        mergeStyles({
          willChange: "height",
          display: "block",
          overflow: "hidden",
        });

        requestAnimationFrame(() => {
          const height = getElementHeight(containerRef);
          mergeStyles({
            transition: `height ${duration}ms ${easing}`,
            height,
          });
        });
      });
    } else {
      requestAnimationFrame(() => {
        onCollapseStart();
        const height = getElementHeight(containerRef);

        mergeStyles({
          transition: `height ${duration}ms ${easing}`,
          willChange: "height",
          height,
        });

        requestAnimationFrame(() => {
          mergeStyles({
            height: "0px",
            overflow: "hidden",
          });
        });
      });
    }
  }

  function getToggleProps({
    disabled = false,
    onClick = noop,
    ...rest
  }: GetTogglePropsInput = {}): GetTogglePropsOutput {
    return {
      type: "button",
      role: "button",
      id: `react-collapsed-toggle`,
      "aria-controls": `react-collapsed-panel`,
      "aria-expanded": isExpanded,
      tabIndex: 0,
      disabled,
      ...rest,
      onClick: disabled
        ? noop
        : callAll(() => expandCollapse(!isExpanded), onToggle, onClick),
    };
  }

  function getCollapseProps({
    style = {},
    onTransitionEnd = noop,
    refKey = "ref",
    ...rest
  }: GetCollapsePropsInput = {}): GetCollapsePropsOutput {
    return {
      id: `react-collapsed-panel`,
      "aria-hidden": !isExpanded,
      [refKey]: containerRef,
      ...rest,
      onTransitionEnd: callAll(handleTransitionEnd, onTransitionEnd),
      style: {
        boxSizing: "border-box",
        // additional styles passed, e.g. getCollapseProps({style: {}})
        ...style,
        // style overrides from state
        ...collapsibleStyles,
      },
    };
  }

  return {
    getToggleProps,
    getCollapseProps,
    isExpanded,
    toggle: () => expandCollapse(!isExpanded),
  };
}

type ButtonType = "submit" | "reset" | "button";

export interface GetTogglePropsOutput {
  disabled: boolean;
  type: ButtonType;
  role: string;
  id: string;
  "aria-controls": string;
  "aria-expanded": boolean;
  tabIndex: number;
  onClick: (e: MouseEvent) => void;
}

export interface GetTogglePropsInput {
  [key: string]: unknown;
  disabled?: boolean;
  refKey?: string;
  onClick?: (e: MouseEvent) => void;
}

export interface GetCollapsePropsOutput {
  id: string;
  onTransitionEnd: (e: TransitionEvent) => void;
  style: CSSProperties;
  "aria-hidden": boolean;
}

export interface GetCollapsePropsInput {
  [key: string]: unknown;
  style?: CSSProperties;
  refKey?: string;
  onTransitionEnd?: (e: TransitionEvent) => void;
}
