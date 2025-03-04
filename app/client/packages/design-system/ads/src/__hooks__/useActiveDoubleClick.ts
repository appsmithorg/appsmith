import { noop } from "lodash";
import { useEffect, useMemo } from "react";
import { useBoolean } from "usehooks-ts";

export function useActiveDoubleClick(
  isActive: boolean,
  onDoubleClick?: () => void,
) {
  const {
    setFalse: setCannotDoubleClick,
    setTrue: setCanDoubleClick,
    value: canDoubleClick,
  } = useBoolean();

  useEffect(
    function handleDoubleClickEnableBasedOnSelection() {
      let timeoutId: ReturnType<typeof setTimeout>;

      if (isActive) {
        timeoutId = setTimeout(() => {
          setCanDoubleClick();
        }, 200);
      } else {
        setCannotDoubleClick();
      }

      return () => {
        clearTimeout(timeoutId);
      };
    },
    [isActive, setCanDoubleClick, setCannotDoubleClick],
  );

  const handleDoubleClick = useMemo(() => {
    if (!canDoubleClick || !onDoubleClick) {
      return noop;
    }

    return onDoubleClick;
  }, [canDoubleClick, onDoubleClick]);

  return handleDoubleClick;
}
