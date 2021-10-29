export const CUSTOM_MAP_PLUGINS: Record<string, any> = {
  world: require(`fusionmaps/maps/fusioncharts.world.js`),
  worldwithantarctica: require(`fusionmaps/maps/fusioncharts.worldwithantarctica.js`),
  europe: require(`fusionmaps/maps/fusioncharts.europe.js`),
  northamerica: require(`fusionmaps/maps/fusioncharts.northamerica.js`),
  southamerica: require(`fusionmaps/maps/fusioncharts.southamerica.js`),
  asia: require(`fusionmaps/maps/fusioncharts.asia.js`),
  oceania: require(`fusionmaps/maps/fusioncharts.oceania.js`),
  africa: require(`fusionmaps/maps/fusioncharts.africa.js`),
};

export const CUSTOM_MAP_TYPES = Object.keys(CUSTOM_MAP_PLUGINS).map(
  (each) => `maps/${each}`,
);
