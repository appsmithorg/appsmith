import { useEffect, useState } from "react";

const useAutoGrow = (value: string, defaultHeight?: number) => {
  const [height, setHeight] = useState(defaultHeight || 24);
  const handleValueChange = () => {
    setTimeout(() => {
      const numberOfLineBreaks = (value.match(/\n/g) || []).length;
      // defaultHeight + lines x line-height
      const newHeight = (defaultHeight || 24) + numberOfLineBreaks * 20;
      setHeight(newHeight);
    });
  };

  useEffect(() => {
    handleValueChange();
  }, [value]);

  return height;
};

export default useAutoGrow;
