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
      if (isActive) {
        setTimeout(() => {
          setCanDoubleClick();
        }, 200);
      } else {
        setCannotDoubleClick();
      }
    },
    [isActive, setCanDoubleClick, setCannotDoubleClick],
  );

  const handleDoubleClick = useMemo(() => {
    if (!canDoubleClick || !onDoubleClick) {
      return noop;
    }

    if (canDoubleClick) {
      return onDoubleClick;
    }
  }, [canDoubleClick, onDoubleClick]);

  return handleDoubleClick;
}
