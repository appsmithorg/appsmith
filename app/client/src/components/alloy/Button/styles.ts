const buttonStyles = {
  baseStyle: {
    rounded: 0,
    textTransform: "uppercase",
    _focus: {
      boxShadow: "none",
    },
    _active: {
      bg: "initial",
    },
  },
  sizes: {
    sm: {
      fontSize: "10px",
      px: 2,
      height: "20px",
      letterSpacing: "1px",
    },
    md: {
      fontSize: "14",
      px: 4,
      height: "30px",
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
        _disabled: {
          bg: "gray.800",
          opacity: 0.4,
        },
      },
      _active: {
        bg: "gray.900",
      },
    },
    primary: {
      bg: "primary.500",
      textColor: "white",
      textTransform: "uppercase",
      _disabled: {
        bg: "primary.700",
      },
      _hover: {
        bg: "primary.700",
        _disabled: {
          bg: "primary.700",
        },
      },
      _active: {
        bg: "primary.800",
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
