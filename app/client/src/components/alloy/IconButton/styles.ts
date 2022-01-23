const buttonStyles = {
  baseStyle: {
    rounded: 0,
    minH: "initial",
    minW: "initial",
    textTransform: "uppercase",
  },
  sizes: {
    sm: {
      fontSize: "10px",
      px: 2,
      py: 2,
      h: 20,
      w: 5,
      webkitURL: "20px",
      letterSpacing: "1px",
    },
    md: {
      fontSize: "xs",
      px: 4,
      py: 4,
      h: "30px",
      w: "30px",
      letterSpacing: "1.2px",
    },
  },
  variants: {
    outline: {
      border: "1.2px solid",
      borderColor: "gray.700",
      color: "gray.600",
    },
    solid: {
      bg: "gray.700",
      color: "white",
      _hover: {
        bg: "gray.800",
      },
    },
    primary: {
      bg: "primary.500",
      textColor: "white",
      textTransform: "uppercase",
      _hover: {
        bg: "primary.700",
      },
    },
  },
  // The default size and variant values
  defaultProps: {
    size: "md",
    variant: "primary",
  },
};

export default buttonStyles;
