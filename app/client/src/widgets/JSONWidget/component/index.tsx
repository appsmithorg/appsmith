import React, { useEffect, useState } from "react";
import ReactJson from "react-json-view";
function JSONComponent(props: JSONComponentProps) {
  const [data, setData] = useState("{}");
  useEffect(() => {
    setData(props.data);
  }, [props]);
  function update(updated_data: any) {
    props.setUpdatedData(updated_data.updated_src);
    return true;
  }
  try {
    return (
      <div>
        <ReactJson
          collapsed={1}
          displayDataTypes={false}
          onAdd={update}
          onDelete={update}
          onEdit={update}
          src={data}
          theme="monokai"
        />
      </div>
    );
  } catch (err) {
    return <div>Enter valid json data</div>;
  }
}

export interface JSONComponentProps {
  data?: any;
  setUpdatedData: any;
  widgetName: string;
}

export default JSONComponent;
