import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd'
import { IWidgetCardProps } from '../../widgets/BaseWidget'
import styled from 'styled-components'
import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'

interface WidgetCardProps {
  details: IWidgetCardProps
}

const Wrapper = styled.div`
  display:flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 10px 5px 10px 5px;
  margin: 0px 10px 0 0;
  border-radius: 5px;
  background: #eee
  border: 1px solid #eee;
  &:hover{
    background: #fff;
    cursor: grab;
  }
`;
const IconLabel = styled.h5`
  text-align: center;
  padding: 10px 0;
  margin: 0;
  text-transform: uppercase;
  font-weight: normal;
  flex-shrink: 1;
  font-size: 0.5rem;
`;

const WidgetCard: React.SFC<WidgetCardProps> = (props) => {
  const [{ isDragging }, drag] = useDrag({
    item: { type: props.details.widgetType, widget: props.details },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })
  return (
    <Wrapper ref={drag}>
      <div>
        <Icon icon="segmented-control" iconSize={20} />
        <IconLabel>{props.details.label}</IconLabel>
      </div>
    </Wrapper>
  )
}

export default WidgetCard