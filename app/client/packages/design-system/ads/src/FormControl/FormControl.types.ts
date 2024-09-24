import type React from "react";

// FormControl props
export type FormControlProps = {
  /** form children - FormLabel, FormHelper, FormError, and control */
  children: React.ReactNode;
  /** (try not to) pass addition classes here */
  className?: string;
  /** label position */
  labelPosition?: "top" | "left";
  /** size of the components */
  size?: "sm" | "md";
  /** required */
  isRequired?: boolean;
  /** disabled */
  isDisabled?: boolean;
  /** id for the form control */
  id?: string;
} & React.HTMLAttributes<HTMLDivElement>;

// FormLabel props
export type FormLabelProps = {
  /** label text */
  children: string;
  /** id for the form control */
  id?: string;
  /** (try not to) pass addition classes here */
  className?: string;
} & React.HTMLAttributes<HTMLLabelElement>;

// FormHelper props
export type FormHelperProps = {
  /** helper text */
  children: string;
  /** id for the form control */
  id?: string;
  /** (try not to) pass addition classes here */
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

// FormError props
export type FormErrorProps = {
  /** error text */
  children: string;
  /** id for the form control */
  id?: string;
  /** (try not to) pass addition classes here */
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;
