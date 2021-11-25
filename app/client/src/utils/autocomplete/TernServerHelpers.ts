const MOMENT_INTERFACE_OBJECTS = ["Moment", "Duration", "Locale"];
const MOMENT_LIBRARY_ORIGIN = "LIB/moment";

export const isMomentInterfaceObject = (completion: any) => {
  return (
    completion &&
    completion.origin === MOMENT_LIBRARY_ORIGIN &&
    MOMENT_INTERFACE_OBJECTS.includes(completion.name)
  );
};
