import React from "react";

// import type { DropdownOption, RenderOption } from "design-system-old";
// import { Dropdown } from "design-system-old";
import { Select, Option } from "design-system";
import type { AppTheme } from "entities/AppTheming";

interface ThemeFontControlProps {
  theme: AppTheme;
  sectionName: string;
  options: any[];
  selectedOption: string;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeFontControl(props: ThemeFontControlProps) {
  // const { options, sectionName, selectedOption, theme, updateTheme } = props;
  const { options, selectedOption } = props;
  // const renderOption: RenderOption = ({
  //   isHighlighted,
  //   isSelectedNode,
  //   option,
  // }) => (
  //   <Option>
  //     <div
  //       className={`flex space-x-2  w-full cursor-pointer ${
  //         isSelectedNode ? "px-2 py-2" : "px-2 py-2 hover:bg-gray-200"
  //       } ${isHighlighted ? "bg-gray-200" : ""}`}
  //       onClick={() => {
  //         if (!isSelectedNode) {
  //           updateTheme({
  //             ...theme,
  //             properties: {
  //               ...theme.properties,
  //               fontFamily: {
  //                 ...theme.properties.fontFamily,
  //                 [sectionName]:
  //                   (option as DropdownOption).value || selectedOption,
  //               },
  //             },
  //           });
  //         }
  //       }}
  //     >
  //       <div className="flex items-center justify-center w-6 h-6 bg-white border">
  //         Aa
  //       </div>
  //       <div className="leading-normal">{(option as DropdownOption).label}</div>
  //     </div>
  //   </Option>
  // );

  return (
    <section className="space-y-2">
      <Select defaultValue={selectedOption}>
        {options.map((option, index) => (
          <Option key={index} value={option.label}>
            <div className="flex space-x-2  w-full cursor-pointer">
              <div className="flex items-center justify-center w-6 h-6 bg-white border">
                Aa
              </div>
              <div className="leading-normal">{option.label}</div>
            </div>
          </Option>
        ))}
      </Select>
    </section>
  );

  // return (
  //   <section className="space-y-2">
  //     <Dropdown
  //       options={options.map((option) => ({
  //         value: option,
  //         label: option,
  //       }))}
  //       portalContainer={
  //         document.getElementById("app-settings-portal") || undefined
  //       }
  //       renderOption={renderOption}
  //       selected={{
  //         label: selectedOption,
  //         value: selectedOption,
  //       }}
  //       showLabelOnly
  //       width="100%"
  //     />
  //   </section>
  // );
}

export default ThemeFontControl;
