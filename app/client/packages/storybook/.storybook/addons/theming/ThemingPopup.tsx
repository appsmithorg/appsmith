import * as React from "react";
import { useEffect } from "react";
import { FORCE_RE_RENDER } from "@storybook/core-events";
import { useGlobals, addons } from "@storybook/manager-api";
import styled from "styled-components";
import { ThemeSettings } from "../../../src";

interface PanelProps {
  leftShift: number;
  onClose: (e: Event) => void;
}

const Wrapper = styled.div`
  position: fixed;
  z-index: 999;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 260px;
  background-color: #fff;
  filter: drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.05))
    drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
  top: 48px;
`;

export const ThemingPopup: React.FC<PanelProps> = ({ leftShift, onClose }) => {
  const [globals, updateGlobals] = useGlobals();
  const updateGlobal = (key, value) => {
    updateGlobals({
      [key]: value,
    }),
      // Invokes Storybook's addon API method (with the FORCE_RE_RENDER) event to trigger a UI refresh
      addons.getChannel().emit(FORCE_RE_RENDER);
  };

  useEffect(() => {
    document.getElementById("root").addEventListener("click", onClose);
    // we have to additionally handle click on Iframe
    document
      .getElementById("storybook-preview-iframe")
      // @ts-expect-error: type mismatch
      .contentWindow.document.addEventListener("click", onClose);
    return () => {
      document.getElementById("root").removeEventListener("click", onClose);
      document
        .getElementById("storybook-preview-iframe")
        // @ts-expect-error: type mismatch
        .contentWindow.document.removeEventListener("click", onClose);
    };
  }, [onClose]);

  return (
    <Wrapper style={{ left: `${leftShift}px` }}>
      <ThemeSettings
        isDarkMode={globals.colorMode === "dark"}
        setDarkMode={(value) =>
          updateGlobal("colorMode", value ? "dark" : "light")
        }
        borderRadius={globals.borderRadius}
        setBorderRadius={(value) => updateGlobal("borderRadius", value)}
        seedColor={globals.seedColor}
        setSeedColor={(value) => updateGlobal("seedColor", value)}
        userDensity={globals.userDensity}
        userSizing={globals.userSizing}
        setUserDensity={(value) => updateGlobal("userDensity", value)}
        setUserSizing={(value) => updateGlobal("userSizing", value)}
      />
    </Wrapper>
  );
};
