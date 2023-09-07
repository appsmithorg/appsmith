import { partialExportWidgets } from "actions/widgetActions";
import { Button, Checkbox } from "design-system";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectWidgetsForCurrentPage } from "selectors/entitiesSelector";

const WidgetsExport = () => {
  const dispatch = useDispatch();
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<string[]>([]);

  const onExportClick = () => {
    dispatch(partialExportWidgets(selectedWidgetIds));
  };
  return (
    <div>
      {widgets?.children?.map((child) => (
        <WidgetEntity
          id={child.widgetId}
          key={child.widgetId}
          name={child.widgetName}
          setSelected={(id: string) =>
            setSelectedWidgetIds([...selectedWidgetIds, id])
          }
          //   type={child.type}
        />
      ))}
      <Button onClick={onExportClick}>Export</Button>
    </div>
  );
};

export default WidgetsExport;

const WidgetEntity = ({
  id,
  name,
  setSelected,
}: //   type,
{
  id: string;
  name: string;
  setSelected: (id: string) => void;
  //   type: string;
}) => {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (!isChecked) return;
    setSelected(id);
  }, [isChecked]);

  return (
    <Checkbox
      isSelected={isChecked}
      name={name}
      onChange={() => setIsChecked(!isChecked)}
    >
      {name}
    </Checkbox>
  );
};
