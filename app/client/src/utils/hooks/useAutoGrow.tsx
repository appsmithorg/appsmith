import { useEffect } from "react";
import { useSpring } from "react-spring";

const useAutoGrow = (ref: HTMLInputElement | HTMLTextAreaElement | null) => {
  const [springHeight, setHeight] = useSpring(() => ({ height: 24 }));
  const handleKeyDown = () => {
    // TODO move to a separate hook
    setTimeout(() => {
      if (ref) {
        // need to reset the height so that
        // the input shrinks as well on removing lines
        setHeight({ height: 0 });
        setHeight({
          height: ref?.scrollHeight || 0,
        });
      }
    });
  };

  useEffect(() => {
    ref?.addEventListener("keydown", handleKeyDown);
    return () => {
      ref?.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref]);

  return springHeight.height;
};

export default useAutoGrow;
