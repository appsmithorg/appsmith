import React from "react";
export interface ButtonGroupProps extends React.ComponentPropsWithoutRef<"div"> {
    children?: React.ReactNode;
    orientation?: "vertical" | "horizontal";
}
export declare const ButtonGroup: React.ForwardRefExoticComponent<ButtonGroupProps & React.RefAttributes<HTMLDivElement>>;
