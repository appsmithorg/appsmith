import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { CommonComponentProps } from "components/ads/common";
import { Colors } from "../../constants/Colors";

/** Styles **/
const MainContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${Colors.Gallery};
  height: 32px;
  padding: 2px;
`;

const SwitchBlock = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${Colors.DARK_GRAY};
  cursor: pointer;
  height: 100%;
  flex: 1;

  ${(props) =>
    props.active &&
    css`
      border: 1px solid ${Colors.ALTO2};
      background-color: ${Colors.WHITE};
      color: ${Colors.GREY_8};
    `}
`;

/** Styles End **/

export type Switch = {
  id: string;
  text: string;
  action: () => void;
};

export type SwitcherProps = CommonComponentProps & {
  switches: Array<Switch>;
  activeSwitchClass?: string;
  activeObj?: Switch;
};

function Switcher(props: SwitcherProps) {
  const { activeObj, switches } = props;
  const [activeSlot, setActiveSlot] = useState("");

  useEffect(() => {
    if (activeObj) {
      switchClickHandler(activeObj, true);
    }
  }, [activeObj]);

  const switchClickHandler = (
    switchObj: Switch,
    preventSwitchAction = false,
  ) => {
    if (switchObj.id !== activeSlot) {
      setActiveSlot(switchObj.id);
      !preventSwitchAction && switchObj.action && switchObj.action();
    }
  };

  return (
    <MainContainer>
      {switches.map((v) => (
        <SwitchBlock
          active={v.id === activeSlot}
          id={`switcher--${v.id}`}
          key={v.id}
          onClick={() => switchClickHandler(v)}
        >
          {v.text}
        </SwitchBlock>
      ))}
    </MainContainer>
  );
}

export default Switcher;
