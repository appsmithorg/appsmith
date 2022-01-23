import React, { useMemo } from "react";
import {
  Box as CBox,
  ThemingProps,
  useStyleConfig,
  BoxProps as CBoxProps,
  useTheme,
  chakra,
} from "@chakra-ui/react";

import AddFillIcon from "remixicon-react/AddFillIcon";

interface IconProps {
  variant?: any;
  size?: any;
  name: typeof AvailableIcons[number];
}

const AvailableIcons = ["plus"] as const;

function Icon(props: CBoxProps & IconProps) {
  const { name, size, variant, ...rest } = props;
  const styles = useStyleConfig("Icon", { variant, size });

  /**
   * returns icon
   */
  const icon = useMemo(() => {
    switch (name) {
      case "plus":
        return AddFillIcon;
    }
  }, [name]);

  const ChakraComponent: any = chakra(icon);

  return <ChakraComponent __css={styles} {...rest} />;
}

export default Icon;
