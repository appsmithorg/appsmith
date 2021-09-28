import { useCallback, useState } from "react";

export default function useForceUpdate() {
  const [, dispatch] = useState(false);
  const forceUpdate = useCallback(() => {
    dispatch((state) => !state);
  }, []);

  return forceUpdate;
}
