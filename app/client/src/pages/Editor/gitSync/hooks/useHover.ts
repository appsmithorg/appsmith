import { useEffect, useState } from "react";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useHover(ref: any) {
  const [hover, setHover] = useState(false);
  const onMouseEnter = () => setHover(true);
  const onMouseLeave = () => setHover(false);

  useEffect(() => {
    const target = ref.current;
    if (target) {
      target.addEventListener("mouseenter", onMouseEnter);
      target.addEventListener("mouseleave", onMouseLeave);
      return () => {
        target.removeEventListener("mouseenter", onMouseEnter);
        target.removeEventListener("mouseleave", onMouseLeave);
      };
    }
  });
  return [hover];
}
