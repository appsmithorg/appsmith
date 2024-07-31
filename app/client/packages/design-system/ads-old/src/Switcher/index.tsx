import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import type { CommonComponentProps } from "../types/common";

/** Styles **/
const MainContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--ads-color-black-75);
  height: 32px;
  padding: 2px;
`;

const SwitchBlock = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 28px;
  color: var(--ads-color-black-450);
  cursor: pointer;
  height: 100%;
  flex: 1;
  border: 1px solid transparent;
  user-select: none;

  ${(props) =>
    props.active &&
    css`
      border: 1px solid var(--ads-color-black-250);
      background-color: var(--ads-color-black-0);
      color: var(--ads-color-black-550);
    `}
`;

/** Styles End **/

export interface Switch {
  id: string;
  text: string;
  action: () => void;
}

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
