import history from "utils/history";

export default function watchForRouteChange(callback: () => void) {
  const unlisten = history.listen(() => {
    callback();
  });

  return () => {
    unlisten();
  };
}
