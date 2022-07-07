/*
Used to convert a list of properties in a type from optional to required

For example, we could make a new type from `Datum`
where 'id' and 'label' required:
  type Datum = {
    description?: string
    id?: string
    label?: string
    value: string
  }

  type DatumWithRequiredIdAndLabel = MandateProps<Datum, 'id' | 'label'>
*/

export type MandateProps<T extends unknown, K extends keyof T> = Omit<T, K> &
  {
    [MK in K]-?: NonNullable<T[MK]>;
  };
