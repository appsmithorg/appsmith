// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.

export enum MapTypes {
  WORLD = "WORLD",
  WORLD_WITH_ANTARCTICA = "WORLD_WITH_ANTARCTICA",
  EUROPE = "EUROPE",
  NORTH_AMERICA = "NORTH_AMERICA",
  SOURTH_AMERICA = "SOURTH_AMERICA",
  ASIA = "ASIA",
  OCEANIA = "OCEANIA",
  AFRICA = "AFRICA",
  USA = "USA",
  CHINA2 = "CHINA2",
}

export interface MapColorObject {
  minValue: number;
  maxValue: number;
  displayValue: string;
  code: string;
  alpha: number;
}

// Define the dataset and the colorRange of the map
export const dataSetForWorld = [
  {
    id: "NA",
    value: ".82",
  },
  {
    id: "SA",
    value: "2.04",
  },
  {
    id: "AS",
    value: "1.78",
  },
  {
    id: "EU",
    value: ".40",
  },
  {
    id: "AF",
    value: "2.58",
  },
  {
    id: "AU",
    value: "1.30",
  },
];

export const dataSetForWorldWithAntarctica = [
  {
    id: "NA",
    value: ".82",
  },
  {
    id: "SA",
    value: "2.04",
  },
  {
    id: "AS",
    value: "1.78",
  },
  {
    id: "EU",
    value: ".40",
  },
  {
    id: "AF",
    value: "2.58",
  },
  {
    id: "AU",
    value: "1.30",
  },
  {
    id: "AT",
    value: "1",
  },
];

export const dataSetForEurope = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
  {
    id: "024",
    value: "1.30",
  },
  {
    id: "025",
    value: ".82",
  },
  {
    id: "026",
    value: "2.04",
  },
  {
    id: "027",
    value: "1.78",
  },
  {
    id: "028",
    value: ".40",
  },
  {
    id: "029",
    value: "2.58",
  },
  {
    id: "030",
    value: "1.30",
  },
  {
    id: "031",
    value: ".82",
  },
  {
    id: "032",
    value: "2.04",
  },
  {
    id: "033",
    value: "1.78",
  },
  {
    id: "034",
    value: ".40",
  },
  {
    id: "035",
    value: "2.58",
  },
  {
    id: "036",
    value: "1.30",
  },
  {
    id: "037",
    value: ".82",
  },
  {
    id: "038",
    value: "2.04",
  },
  {
    id: "039",
    value: "1.78",
  },
  {
    id: "040",
    value: ".40",
  },
  {
    id: "041",
    value: "2.58",
  },
  {
    id: "042",
    value: "1.30",
  },

  {
    id: "043",
    value: ".82",
  },
  {
    id: "044",
    value: "2.04",
  },
  {
    id: "045",
    value: "1.78",
  },
  {
    id: "046",
    value: ".40",
  },
  {
    id: "047",
    value: "2.58",
  },
];

export const dataSetForNorthAmerica = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
];

export const dataSetForSouthAmerica = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
];

export const dataSetForAsia = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
  {
    id: "024",
    value: "1.30",
  },
  {
    id: "025",
    value: ".82",
  },
  {
    id: "026",
    value: "2.04",
  },
  {
    id: "027",
    value: "1.78",
  },
  {
    id: "028",
    value: ".40",
  },
  {
    id: "029",
    value: "2.58",
  },
  {
    id: "030",
    value: "1.30",
  },
  {
    id: "031",
    value: ".82",
  },
  {
    id: "032",
    value: "2.04",
  },
  {
    id: "033",
    value: "1.78",
  },
  {
    id: "034",
    value: ".40",
  },
  {
    id: "035",
    value: "2.58",
  },
  {
    id: "036",
    value: "1.30",
  },
  {
    id: "037",
    value: ".82",
  },
  {
    id: "038",
    value: "2.04",
  },
  {
    id: "039",
    value: "1.78",
  },
  {
    id: "040",
    value: ".40",
  },
  {
    id: "041",
    value: "2.58",
  },
  {
    id: "042",
    value: "1.30",
  },

  {
    id: "043",
    value: ".82",
  },
  {
    id: "044",
    value: "2.04",
  },
  {
    id: "045",
    value: "1.78",
  },
  {
    id: "046",
    value: ".40",
  },
  {
    id: "047",
    value: "2.58",
  },
  {
    id: "048",
    value: ".82",
  },
  {
    id: "049",
    value: "2.04",
  },
  {
    id: "050",
    value: "1.78",
  },
  {
    id: "051",
    value: ".40",
  },
  {
    id: "052",
    value: "2.58",
  },
  {
    id: "053",
    value: "1.30",
  },
  {
    id: "054",
    value: ".82",
  },
  {
    id: "055",
    value: "2.04",
  },
  {
    id: "056",
    value: "1.78",
  },
  {
    id: "057",
    value: ".40",
  },
  {
    id: "058",
    value: "2.58",
  },
  {
    id: "059",
    value: "1.30",
  },
  {
    id: "060",
    value: ".82",
  },
  {
    id: "061",
    value: "2.04",
  },
  {
    id: "062",
    value: "1.78",
  },
  {
    id: "063",
    value: ".40",
  },
  {
    id: "064",
    value: "2.58",
  },
];

export const dataSetForOceania = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
];

export const dataSetForAfrica = [
  {
    id: "001",
    value: ".82",
  },
  {
    id: "002",
    value: "2.04",
  },
  {
    id: "003",
    value: "1.78",
  },
  {
    id: "004",
    value: ".40",
  },
  {
    id: "005",
    value: "2.58",
  },
  {
    id: "006",
    value: "1.30",
  },
  {
    id: "007",
    value: ".82",
  },
  {
    id: "008",
    value: "2.04",
  },
  {
    id: "009",
    value: "1.78",
  },
  {
    id: "010",
    value: ".40",
  },
  {
    id: "011",
    value: "2.58",
  },
  {
    id: "012",
    value: "1.30",
  },
  {
    id: "013",
    value: ".82",
  },
  {
    id: "014",
    value: "2.04",
  },
  {
    id: "015",
    value: "1.78",
  },
  {
    id: "016",
    value: ".40",
  },
  {
    id: "017",
    value: "2.58",
  },
  {
    id: "018",
    value: "1.30",
  },

  {
    id: "019",
    value: ".82",
  },
  {
    id: "020",
    value: "2.04",
  },
  {
    id: "021",
    value: "1.78",
  },
  {
    id: "022",
    value: ".40",
  },
  {
    id: "023",
    value: "2.58",
  },
  {
    id: "024",
    value: "1.30",
  },
  {
    id: "025",
    value: ".82",
  },
  {
    id: "026",
    value: "2.04",
  },
  {
    id: "027",
    value: "1.78",
  },
  {
    id: "028",
    value: ".40",
  },
  {
    id: "029",
    value: "2.58",
  },
  {
    id: "030",
    value: "1.30",
  },
  {
    id: "031",
    value: ".82",
  },
  {
    id: "032",
    value: "2.04",
  },
  {
    id: "033",
    value: "1.78",
  },
  {
    id: "034",
    value: ".40",
  },
  {
    id: "035",
    value: "2.58",
  },
  {
    id: "036",
    value: "1.30",
  },
  {
    id: "037",
    value: ".82",
  },
  {
    id: "038",
    value: "2.04",
  },
  {
    id: "039",
    value: "1.78",
  },
  {
    id: "040",
    value: ".40",
  },
  {
    id: "041",
    value: "2.58",
  },
  {
    id: "042",
    value: "1.30",
  },

  {
    id: "043",
    value: ".82",
  },
  {
    id: "044",
    value: "2.04",
  },
  {
    id: "045",
    value: "1.78",
  },
  {
    id: "046",
    value: ".40",
  },
  {
    id: "047",
    value: "2.58",
  },
  {
    id: "048",
    value: ".82",
  },
  {
    id: "049",
    value: "2.04",
  },
  {
    id: "050",
    value: "1.78",
  },
  {
    id: "051",
    value: ".40",
  },
  {
    id: "052",
    value: "2.58",
  },
  {
    id: "053",
    value: "1.30",
  },
  {
    id: "054",
    value: ".82",
  },
  {
    id: "055",
    value: "2.04",
  },
  {
    id: "056",
    value: "1.78",
  },
  {
    id: "057",
    value: ".40",
  },
  {
    id: "058",
    value: "2.58",
  },
  {
    id: "059",
    value: "1.30",
  },
  {
    id: "060",
    value: ".82",
  },
];

export const dataSetForUSA = [
  { id: "AK", value: "1.96" },
  { id: "AL", value: "2.22" },
  { id: "AR", value: "1.21" },
  { id: "AZ", value: "2.57" },
  { id: "CA", value: "1.27" },
  { id: "CO", value: "1.97" },
  { id: "CT", value: "2.97" },
  { id: "DC", value: "2.49" },
  { id: "DE", value: "1.55" },
  { id: "FL", value: "0.73" },
  { id: "GA", value: "2.52" },
  { id: "HI", value: "1.39" },
  { id: "IA", value: "2.21" },
  { id: "ID", value: "2.11" },
  { id: "IL", value: "1.30" },
  { id: "IN", value: "2.54" },
  { id: "KS", value: "1.27" },
  { id: "KY", value: "0.97" },
  { id: "LA", value: "1.52" },
  { id: "MA", value: "1.71" },
  { id: "MD", value: "1.44" },
  { id: "ME", value: "0.34" },
  { id: "MI", value: "2.18" },
  { id: "MN", value: "2.81" },
  { id: "MO", value: "1.61" },
  { id: "MS", value: "3.00" },
  { id: "MT", value: "0.57" },
  { id: "NC", value: "2.95" },
  { id: "ND", value: "2.10" },
  { id: "NE", value: "2.39" },
  { id: "NH", value: "1.55" },
  { id: "NJ", value: "2.41" },
  { id: "NM", value: "1.38" },
  { id: "NV", value: "2.97" },
  { id: "NY", value: "2.97" },
  { id: "OH", value: "1.23" },
  { id: "OK", value: "2.24" },
  { id: "OR", value: "2.36" },
  { id: "PA", value: "1.54" },
  { id: "RI", value: "1.85" },
  { id: "SC", value: "2.32" },
  { id: "SD", value: "2.97" },
  { id: "TN", value: "1.29" },
  { id: "TX", value: "2.28" },
  { id: "UT", value: "1.08" },
  { id: "VA", value: "1.05" },
  { id: "VT", value: "2.97" },
  { id: "WA", value: "1.40" },
  { id: "WI", value: "0.34" },
  { id: "WV", value: "1.30" },
  { id: "WY", value: "2.97" },
];

export const dataSetForChina = [
  {
    id: "CN.AH",
    value: "1.96",
    displayValue: "Anhui",
    tooltext: "Anhui,1.96",
  },
  {
    id: "CN.BJ",
    value: "2.1",
    displayValue: "Beijing",
    tooltext: "Beijing,2.1",
  },
  {
    id: "CN.CQ",
    value: "0.6",
    displayValue: "Chongqing",
    tooltext: "Anhui,0.6",
  },
  {
    id: "CN.FJ",
    value: "1",
    displayValue: "Fujian",
    tooltext: "Fujian,1",
  },
  {
    id: "CN.GS",
    value: "1",
    displayValue: "Gansu",
    tooltext: "Gansu,1",
  },
  {
    id: "CN.GD",
    value: "1",
    displayValue: "Guangdong",
    tooltext: "Guangdong,1",
  },
  {
    id: "CN.GX",
    value: "1",
    displayValue: "Guangxi Zhuang",
    tooltext: "Guangxi Zhuang,1",
  },
  {
    id: "CN.GZ",
    value: "1",
    displayValue: "Guizhou",
    tooltext: "Guizhou,1",
  },
  {
    id: "CN.HA",
    value: "1",
    displayValue: "Hainan",
    tooltext: "Hainan,1",
  },
  {
    id: "CN.HB",
    value: "1",
    displayValue: "Hebei",
    tooltext: "Hebei,1",
  },
  {
    id: "CN.HL",
    value: "1",
    displayValue: "Heilongjiang",
    tooltext: "Heilongjiang,1",
  },
  {
    id: "CN.HE",
    value: "1",
    displayValue: "Henan",
    tooltext: "Henan,1",
  },
  {
    id: "CN.HK",
    value: "1",
    displayValue: "HongKong",
    tooltext: "HongKong,1",
  },
  {
    id: "CN.HU",
    value: "1",
    displayValue: "Hubei",
    tooltext: "Hubei,1",
  },
  {
    id: "CN.HN",
    value: "1",
    displayValue: "Hunan",
    tooltext: "Hunan,1",
  },
  {
    id: "CN.JS",
    value: "1",
    displayValue: "Jiangsu",
    tooltext: "Jiangsu,1",
  },
  {
    id: "CN.JX",
    value: "1",
    displayValue: "Jiangxi",
    tooltext: "Jiangxi,1",
  },
  {
    id: "CN.JL",
    value: "1",
    displayValue: "Jilin",
    tooltext: "Jilin,1",
  },
  {
    id: "CN.LN",
    value: "1",
    displayValue: "Liaoning",
    tooltext: "Liaoning,1",
  },
  {
    id: "CN.MA",
    value: "1",
    displayValue: "Macao",
    tooltext: "Macao,1",
  },
  {
    id: "CN.NM",
    value: "1",
    displayValue: "Nei Mongol",
    tooltext: "Nei Mongol,1",
  },
  {
    id: "CN.NX",
    value: "1",
    displayValue: "Ningxia Hui",
    tooltext: "Ningxia Hui,1",
  },
  {
    id: "CN.QH",
    value: "1",
    displayValue: "Qinghai",
    tooltext: "Qinghai,1",
  },
  {
    id: "CN.SA",
    value: "1",
    displayValue: "Shaanxi",
    tooltext: "Shaanxi,1",
  },
  {
    id: "CN.SD",
    value: "1",
    displayValue: "Shandong",
    tooltext: "Shandong,1",
  },
  {
    id: "CN.SH",
    value: "1",
    displayValue: "Shanghai",
    tooltext: "Shanghai,1",
  },
  {
    id: "CN.SX",
    value: "1",
    displayValue: "Shanxi",
    tooltext: "Shanxi,1",
  },
  {
    id: "CN.SC",
    value: "1",
    displayValue: "Sichuan",
    tooltext: "Sichuan,1",
  },
  {
    id: "CN.TA",
    value: "1",
    displayValue: "Taiwan",
    tooltext: "Taiwan,1",
  },
  {
    id: "CN.TJ",
    value: "1",
    displayValue: "Tianjin",
    tooltext: "Tianjin,1",
  },
  {
    id: "CN.XZ",
    value: "1",
    displayValue: "Tibet(Xizang)",
    tooltext: "Tibet(Xizang),1",
  },
  {
    id: "CN.XJ",
    value: "1",
    displayValue: "Xinjiang Uygur",
    tooltext: "Xinjiang Uygur,1",
  },
  {
    id: "CN.YN",
    value: "1",
    displayValue: "Yunnan",
    tooltext: "Yunnan,1",
  },
  {
    id: "CN.ZJ",
    value: "1",
    displayValue: " 	Zhejiang",
    tooltext: " 	Zhejiang,1",
  },
];
