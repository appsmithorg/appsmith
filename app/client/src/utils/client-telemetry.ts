import { initializeFaro } from "@grafana/faro-web-sdk";

const faro = initializeFaro({
  url: "https://dev.appsmith.com/collect",
  // apiKey: "api_key",
  app: {
    name: "frontend",
    version: "1.0.0",
  },
});

export default faro;
