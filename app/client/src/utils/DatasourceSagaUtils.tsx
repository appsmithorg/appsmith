import { DATASOURCE_NAME_DEFAULT_PREFIX } from "constants/Datasource";
import { Datasource } from "entities/Datasource";

/**
 *
 * @param datasoures Array of datasource objects
 * @returns next sequence number for untitled datasources
 */
export function getUntitledDatasourceSequence(
  dsList: Array<Datasource>,
): number {
  let maxSeq = Number.MIN_VALUE;
  dsList
    .filter((ele) => ele.name.includes(DATASOURCE_NAME_DEFAULT_PREFIX))
    .forEach((ele) => {
      const seq = parseInt(ele.name.split(" ")[2]);
      if (!isNaN(seq) && maxSeq < seq) {
        maxSeq = seq;
      }
    });
  return maxSeq === Number.MIN_VALUE ? 1 : maxSeq + 1;
}
