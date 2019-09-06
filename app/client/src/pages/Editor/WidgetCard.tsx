import React, { useState, useLayoutEffect, MutableRefObject } from 'react';
import { useDrag, DragSourceMonitor, DragPreviewImage } from 'react-dnd'
import blankImage from "../../assets/images/blank.png"
import { WidgetCardProps } from '../../widgets/BaseWidget'
import styled from 'styled-components';
import { generateReactKey } from "../../utils/generators"


type CardProps = {
  details: WidgetCardProps;
}

export const Wrapper = styled.div`
  padding: 10px 5px 10px 5px;
  border-radius: ${props => props.theme.radii[1]}px;
  background: ${props => props.theme.colors.paneCard};
  border: 1px solid ${props=> props.theme.colors.paneCard};
  color: ${props => props.theme.colors.textOnDarkBG};
  & > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &:hover{
    background: #fff;
    cursor: grab;
    color: ${props => props.theme.colors.textDefault}
  }
  & i {
    font-family: ${props => props.theme.fonts[2]};
    font-size: ${props => props.theme.fontSizes[7]}px;
  }
`;

export const IconLabel = styled.h5`
  text-align: center;
  margin: 0;
  text-transform: uppercase;
  font-weight: ${props => props.theme.fontWeights[1]};
  flex-shrink: 1;
  font-size: ${props => props.theme.fontSizes[1]}px;
  line-height: ${props => props.theme.lineHeights[1]}px;
`;

/* eslint-disable @typescript-eslint/no-unused-vars */
const WidgetCard = (props: CardProps) => {
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
  }, [setInitialOffset]);
  return (
    <React.Fragment >
      <DragPreviewImage connect={preview} src={blankImage} />
      <Wrapper ref={drag}>
        <div ref={card}>
          <i className={props.details.icon} />
          <IconLabel>{props.details.label}</IconLabel>
        </div>
      </Wrapper>
    </React.Fragment>
  )
}

export default WidgetCard