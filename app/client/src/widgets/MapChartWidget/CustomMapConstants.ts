import world from "fusionmaps/maps/fusioncharts.world.js";
import worldwithantarctica from "fusionmaps/maps/fusioncharts.worldwithantarctica.js";
import europe from "fusionmaps/maps/fusioncharts.europe.js";
import northamerica from "fusionmaps/maps/fusioncharts.northamerica.js";
import southamerica from "fusionmaps/maps/fusioncharts.southamerica.js";
import asia from "fusionmaps/maps/fusioncharts.asia.js";
import oceania from "fusionmaps/maps/fusioncharts.oceania.js";
import africa from "fusionmaps/maps/fusioncharts.africa.js";

export const CUSTOM_MAP_PLUGINS: Record<string, any> = {
  world,
  worldwithantarctica,
  europe,
  northamerica,
  southamerica,
  asia,
  oceania,
  africa,
};

export const CUSTOM_MAP_TYPES = Object.keys(CUSTOM_MAP_PLUGINS).map(
  (each) => `maps/${each}`,
);
