import React, { useState, useLayoutEffect, MutableRefObject } from 'react';
import { useDrag, DragSourceMonitor, DragPreviewImage } from 'react-dnd'
import blankImage from "../../assets/images/blank.png"
import { IWidgetCardProps } from '../../widgets/BaseWidget'
import styled from 'styled-components';
import { Icon } from '@blueprintjs/core'
import {  IconNames } from '@blueprintjs/icons'
import { generateReactKey } from "../../utils/generators"


type WidgetCardProps = {
  details: IWidgetCardProps;
}

export const Wrapper = styled.div`
  display:flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 10px 5px 10px 5px;
  margin: 0px 10px 0 0;
  border-radius: 5px;
  background: ${props => props.theme.colors.paneCard};
  border: 1px solid ${props=> props.theme.colors.paneCard};
  &:hover{
    background: #fff;
    cursor: grab;
  }
`;
export const IconLabel = styled.h5`
  text-align: center;
  padding: 10px 0;
  margin: 0;
  text-transform: uppercase;
  font-weight: normal;
  flex-shrink: 1;
  font-size: 0.5rem;
`;

/* eslint-disable @typescript-eslint/no-unused-vars */
const WidgetCard = (props: WidgetCardProps) => {
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0})

  const [{ isDragging }, drag, preview] = useDrag({ 
    item: { type: props.details.widgetType, widget: props.details, key: generateReactKey(), initialOffset},
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })
  const card: MutableRefObject<HTMLDivElement | null> = React.useRef(null)
  useLayoutEffect(()=> {
    const el = card.current
    if (el) {
      const rect = el.getBoundingClientRect()
      setInitialOffset({
        x: Math.ceil(rect.left),
        y: Math.ceil(rect.top)
      })
    }
  }, [setInitialOffset])
  return (
    <React.Fragment >
      <DragPreviewImage connect={preview} src={blankImage} />
    <Wrapper ref={drag}>
      <div ref={card}>
        <Icon icon={IconNames.SEGMENTED_CONTROL} iconSize={20} />
        <IconLabel>{props.details.label}</IconLabel>
      </div>
    </Wrapper>
    </React.Fragment>
  )
}

export default WidgetCard