import { MapTypes } from "widgets/MapChartWidget/constants";

/*
 * Map of country/region code to the details (short_label, full name).
 *
 * Why we need this?
 *  - We need this data to populate the label and tooltip. These values are not part of the underlying map.
 */
export default {
  [MapTypes.WORLD]: {
    AF: {
      short_label: "AF",
      label: "Africa",
    },
    AS: {
      short_label: "AS",
      label: "Asia",
    },
    AU: {
      short_label: "AU",
      label: "Australia",
    },
    EU: {
      short_label: "EU",
      label: "Europe",
    },
    NA: {
      short_label: "NA",
      label: "North America",
    },
    SA: {
      short_label: "SA",
      label: "South America",
    },
  },
  [MapTypes.WORLD_WITH_ANTARCTICA]: {
    AF: {
      short_label: "AF",
      label: "Africa",
    },
    AT: {
      short_label: "AT",
      label: "Antarctica",
    },
    AS: {
      short_label: "AS",
      label: "Asia",
    },
    AU: {
      short_label: "AU",
      label: "Australia",
    },
    EU: {
      short_label: "EU",
      label: "Europe",
    },
    NA: {
      short_label: "NA",
      label: "North America",
    },
    SA: {
      short_label: "SA",
      label: "South America",
    },
  },
  [MapTypes.EUROPE]: {
    "001": {
      short_label: "AL",
      label: "Albania",
    },
    "002": {
      short_label: "AD",
      label: "Andorra",
    },
    "003": {
      short_label: "AT",
      label: "Austria",
    },
    "004": {
      short_label: "BY",
      label: "Belarus",
    },
    "005": {
      short_label: "BE",
      label: "Belgium",
    },
    "006": {
      short_label: "BA",
      label: "Bosnia and Herzegovina",
    },
    "007": {
      short_label: "BG",
      label: "Bulgaria",
    },
    "008": {
      short_label: "HY",
      label: "Croatia",
    },
    "044": {
      short_label: "CY",
      label: "Cyprus",
    },
    "009": {
      short_label: "CZ",
      label: "Czech Republic",
    },
    "010": {
      short_label: "DK",
      label: "Denmark",
    },
    "011": {
      short_label: "EE",
      label: "Estonia",
    },
    "012": {
      short_label: "FI",
      label: "Finland",
    },
    "013": {
      short_label: "FR",
      label: "France",
    },
    "014": {
      short_label: "DE",
      label: "Germany",
    },
    "015": {
      short_label: "GR",
      label: "Greece",
    },
    "016": {
      short_label: "HU",
      label: "Hungary",
    },
    "017": {
      short_label: "IS",
      label: "Iceland",
    },
    "018": {
      short_label: "IE",
      label: "Ireland",
    },
    "019": {
      short_label: "IT",
      label: "Italy",
    },
    "047": {
      short_label: "KO",
      label: "Kosovo",
    },
    "020": {
      short_label: "LV",
      label: "Latvia",
    },
    "021": {
      short_label: "LI",
      label: "Liechtenstein",
    },
    "022": {
      short_label: "LT",
      label: "Lithuania",
    },
    "023": {
      short_label: "LU",
      label: "Luxembourg",
    },
    "024": {
      short_label: "MK",
      label: "Macedonia",
    },
    "025": {
      short_label: "MT",
      label: "Malta",
    },
    "026": {
      short_label: "MD",
      label: "Moldova",
    },
    "027": {
      short_label: "MC",
      label: "Monaco",
    },
    "028": {
      short_label: "MO",
      label: "Montenegro",
    },
    "029": {
      short_label: "NL",
      label: "Netherlands",
    },
    "030": {
      short_label: "NO",
      label: "Norway",
    },
    "031": {
      short_label: "PL",
      label: "Poland",
    },
    "032": {
      short_label: "PT",
      label: "Portugal",
    },
    "033": {
      short_label: "RO",
      label: "Romania",
    },
    "046": {
      short_label: "RU",
      label: "Russia",
    },
    "034": {
      short_label: "SM",
      label: "San Marino",
    },
    "035": {
      short_label: "CS",
      label: "Serbia",
    },
    "036": {
      short_label: "SK",
      label: "Slovakia",
    },
    "037": {
      short_label: "SL",
      label: "Slovenia",
    },
    "038": {
      short_label: "ES",
      label: "Spain",
    },
    "039": {
      short_label: "SE",
      label: "Sweden",
    },
    "040": {
      short_label: "CH",
      label: "Switzerland",
    },
    "045": {
      short_label: "TK",
      label: "Turkey",
    },
    "041": {
      short_label: "UA",
      label: "Ukraine",
    },
    "042": {
      short_label: "UK",
      label: "United Kingdom",
    },
    "043": {
      short_label: "VA",
      label: "Vatican City",
    },
  },
  [MapTypes.NORTH_AMERICA]: {
    "001": {
      short_label: "AG",
      label: "Antigua and Barbuda",
    },
    "002": {
      short_label: "BS",
      label: "Bahamas",
    },
    "003": {
      short_label: "BB",
      label: "Barbados",
    },
    "004": {
      short_label: "BZ",
      label: "Belize",
    },
    "005": {
      short_label: "CA",
      label: "Canada",
    },
    "026": {
      short_label: "KY",
      label: "Cayman Islands",
    },
    "006": {
      short_label: "CR",
      label: "Costa Rica",
    },
    "007": {
      short_label: "CU",
      label: "Cuba",
    },
    "008": {
      short_label: "DM",
      label: "Dominica",
    },
    "009": {
      short_label: "DO",
      label: "Dominican Rep.",
    },
    "010": {
      short_label: "SV",
      label: "El Salvador",
    },
    "024": {
      short_label: "GL",
      label: "Greenland",
    },
    "011": {
      short_label: "GD",
      label: "Grenada",
    },
    "012": {
      short_label: "GT",
      label: "Guatemala",
    },
    "013": {
      short_label: "HT",
      label: "Haiti",
    },
    "014": {
      short_label: "HN",
      label: "Honduras",
    },
    "015": {
      short_label: "JM",
      label: "Jamaica",
    },
    "016": {
      short_label: "MX",
      label: "Mexico",
    },
    "017": {
      short_label: "NI",
      label: "Nicaragua",
    },
    "018": {
      short_label: "PA",
      label: "Panama",
    },
    "025": {
      short_label: "PR",
      label: "Puerto Rico",
    },
    "019": {
      short_label: "KN",
      label: "St. Kitts & Nevis",
    },
    "020": {
      short_label: "LC",
      label: "St. Lucia",
    },
    "021": {
      short_label: "VC",
      label: "St. Vincent & the Grenadines",
    },
    "022": {
      short_label: "TT",
      label: "Trinidad & Tobago",
    },
    "023": {
      short_label: "US",
      label: "United States",
    },
  },
  [MapTypes.SOURTH_AMERICA]: {
    "001": {
      short_label: "AR",
      label: "Argentina",
    },
    "002": {
      short_label: "BO",
      label: "Bolivia",
    },
    "003": {
      short_label: "BR",
      label: "Brazil",
    },
    "004": {
      short_label: "CL",
      label: "Chile",
    },
    "005": {
      short_label: "CO",
      label: "Colombia",
    },
    "006": {
      short_label: "EC",
      label: "Ecuador",
    },
    "007": {
      short_label: "FK",
      label: "Falkland Islands",
    },
    "008": {
      short_label: "GF",
      label: "French Guiana",
    },
    "015": {
      short_label: "GI",
      label: "Galapagos Islands",
    },
    "009": {
      short_label: "GY",
      label: "Guyana",
    },
    "010": {
      short_label: "PY",
      label: "Paraguay",
    },
    "011": {
      short_label: "PE",
      label: "Peru",
    },
    "016": {
      short_label: "SG",
      label: "South Georgia Island",
    },
    "012": {
      short_label: "SR",
      label: "Suriname",
    },
    "013": {
      short_label: "UY",
      label: "Uruguay",
    },
    "014": {
      short_label: "VE",
      label: "Venezuela",
    },
  },
  [MapTypes.ASIA]: {
    "001": {
      short_label: "AF",
      label: "Afghanistan",
    },
    "002": {
      short_label: "AM",
      label: "Armenia",
    },
    "003": {
      short_label: "AZ",
      label: "Azerbaijan",
    },
    "060": {
      short_label: "BA",
      label: "Bahrain",
    },
    "005": {
      short_label: "BD",
      label: "Bangladesh",
    },
    "006": {
      short_label: "BT",
      label: "Bhutan",
    },
    "007": {
      short_label: "BN",
      label: "Brunei",
    },
    "008": {
      short_label: "MM",
      label: "Burma (Myanmar)",
    },
    "009": {
      short_label: "KH",
      label: "Cambodia",
    },
    "010": {
      short_label: "CN",
      label: "China",
    },
    "012": {
      short_label: "TP",
      label: "East Timor",
    },
    "013": {
      short_label: "GE",
      label: "Georgia",
    },
    "050": {
      short_label: "HK",
      label: "Hong Kong",
    },
    "014": {
      short_label: "IN",
      label: "India",
    },
    "015": {
      short_label: "ID",
      label: "Indonesia",
    },
    "016": {
      short_label: "IR",
      label: "Iran",
    },
    "054": {
      short_label: "IZ",
      label: "Iraq",
    },
    "063": {
      short_label: "IS",
      label: "Israel",
    },
    "019": {
      short_label: "JP",
      label: "Japan",
    },
    "062": {
      short_label: "JO",
      label: "Jordan",
    },
    "021": {
      short_label: "KZ",
      label: "Kazakhstan",
    },
    "022": {
      short_label: "KP",
      label: "Korea (north)",
    },
    "023": {
      short_label: "KR",
      label: "Korea (south)",
    },
    "061": {
      short_label: "KU",
      label: "Kuwait",
    },
    "025": {
      short_label: "KG",
      label: "Kyrgyzstan",
    },
    "026": {
      short_label: "LA",
      label: "Laos",
    },
    "064": {
      short_label: "LE",
      label: "Lebanon",
    },
    "051": {
      short_label: "MO",
      label: "Macau",
    },
    "028": {
      short_label: "MY",
      label: "Malaysia",
    },
    "030": {
      short_label: "MN",
      label: "Mongolia",
    },
    "031": {
      short_label: "NP",
      label: "Nepal",
    },
    "057": {
      short_label: "MU",
      label: "Oman",
    },
    "033": {
      short_label: "PK",
      label: "Pakistan",
    },
    "034": {
      short_label: "PH",
      label: "Philippines",
    },
    "059": {
      short_label: "QA",
      label: "Qatar",
    },
    "036": {
      short_label: "RU",
      label: "Russian Federation",
    },
    "055": {
      short_label: "SA",
      label: "Saudi Arabia",
    },
    "038": {
      short_label: "SG",
      label: "Singapore",
    },
    "039": {
      short_label: "LK",
      label: "Sri Lanka",
    },
    "053": {
      short_label: "SY",
      label: "Syria",
    },
    "049": {
      short_label: "TW",
      label: "Taiwan",
    },
    "041": {
      short_label: "TJ",
      label: "Tajikistan",
    },
    "042": {
      short_label: "TH",
      label: "Thailand",
    },
    "052": {
      short_label: "TU",
      label: "Turkey",
    },
    "044": {
      short_label: "TM",
      label: "Turkmenistan",
    },
    "058": {
      short_label: "AE",
      label: "United Arab Emirates",
    },
    "046": {
      short_label: "UZ",
      label: "Uzbekistan",
    },
    "047": {
      short_label: "VN",
      label: "Vietnam",
    },
    "056": {
      short_label: "YM",
      label: "Yemen",
    },
  },
  [MapTypes.OCEANIA]: {
    "001": {
      short_label: "AU",
      label: "Australia",
    },
    "002": {
      short_label: "FJ",
      label: "Fiji",
    },
    "003": {
      short_label: "KI",
      label: "Kiribati",
    },
    "004": {
      short_label: "MH",
      label: "Marshall Islands",
    },
    "005": {
      short_label: "FM",
      label: "Micronesia",
    },
    "006": {
      short_label: "NR",
      label: "Nauru",
    },
    "015": {
      short_label: "NC",
      label: "New Caledonia",
    },
    "007": {
      short_label: "NZ",
      label: "New Zealand",
    },
    "008": {
      short_label: "PW",
      label: "Palau",
    },
    "009": {
      short_label: "PG",
      label: "Papua New Guinea",
    },
    "010": {
      short_label: "WS",
      label: "Samoa",
    },
    "011": {
      short_label: "SB",
      label: "Solomon Islands",
    },
    "012": {
      short_label: "TO",
      label: "Tonga",
    },
    "013": {
      short_label: "TV",
      label: "Tuvalu",
    },
    "014": {
      short_label: "VU",
      label: "Vanuatu",
    },
    "016": {
      short_label: "PC",
      label: "Pitcairn Island",
    },
    "017": {
      short_label: "FP",
      label: "French Polynesia",
    },

    "022": {
      short_label: "CO",
      label: "Cook Island",
    },
    "018": {
      short_label: "NI",
      label: "Niue",
    },
    "019": {
      short_label: "AS",
      label: "American Samoa",
    },
    "020": {
      short_label: "GU",
      label: "Guam",
    },
    "021": {
      short_label: "NM",
      label: "North Mariana Island",
    },
  },
  [MapTypes.AFRICA]: {
    "001": {
      short_label: "DZ",
      label: "Algeria",
    },
    "002": {
      short_label: "AO",
      label: "Angola",
    },
    "003": {
      short_label: "BJ",
      label: "Benin",
    },
    "004": {
      short_label: "BW",
      label: "Botswana",
    },
    "005": {
      short_label: "BF",
      label: "Burkina Faso",
    },
    "006": {
      short_label: "BI",
      label: "Burundi",
    },
    "007": {
      short_label: "CM",
      label: "Cameroon",
    },
    "059": {
      short_label: "CA",
      label: "Canary Islands",
    },
    "008": {
      short_label: "CV",
      label: "Cape Verde",
    },
    "009": {
      short_label: "CR",
      label: "Central African Republic",
    },
    "010": {
      short_label: "TD",
      label: "Chad",
    },
    "057": {
      short_label: "CG",
      label: "Congo",
    },
    "012": {
      short_label: "CI",
      label: "Cote d'Ivoire",
    },
    "013": {
      short_label: "CD",
      label: "Democratic Republic of the Congo",
    },
    "014": {
      short_label: "DJ",
      label: "Djibouti",
    },
    "015": {
      short_label: "EG",
      label: "Egypt",
    },
    "016": {
      short_label: "GQ",
      label: "Equatorial Guinea",
    },
    "017": {
      short_label: "ER",
      label: "Eritrea",
    },
    "018": {
      short_label: "ET",
      label: "Ethiopia",
    },
    "019": {
      short_label: "GA",
      label: "Gabon",
    },
    "056": {
      short_label: "GM",
      label: "Gambia",
    },
    "020": {
      short_label: "GH",
      label: "Ghana",
    },
    "021": {
      short_label: "GN",
      label: "Guinea",
    },
    "022": {
      short_label: "GW",
      label: "Guinea-Bissau",
    },
    "023": {
      short_label: "KE",
      label: "Kenya",
    },
    "024": {
      short_label: "LS",
      label: "Lesotho",
    },
    "025": {
      short_label: "LI",
      label: "Liberia",
    },
    "026": {
      short_label: "LR",
      label: "Libya",
    },
    "027": {
      short_label: "MG",
      label: "Madagascar",
    },
    "028": {
      short_label: "MW",
      label: "Malawi",
    },
    "029": {
      short_label: "ML",
      label: "Mali",
    },
    "030": {
      short_label: "MR",
      label: "Mauritania",
    },
    "058": {
      short_label: "MU",
      label: "Mauritius",
    },
    "032": {
      short_label: "MA",
      label: "Morocco",
    },
    "033": {
      short_label: "MZ",
      label: "Mozambique",
    },
    "034": {
      short_label: "NA",
      label: "Namibia",
    },
    "035": {
      short_label: "NE",
      label: "Niger",
    },
    "036": {
      short_label: "NG",
      label: "Nigeria",
    },
    "038": {
      short_label: "RW",
      label: "Rwanda",
    },
    "040": {
      short_label: "ST",
      label: "Sao Tome and Principe",
    },
    "041": {
      short_label: "SN",
      label: "Senegal",
    },
    "042": {
      short_label: "SY",
      label: "Seychelles",
    },
    "043": {
      short_label: "SL",
      label: "Sierra Leone",
    },
    "044": {
      short_label: "SO",
      label: "Somalia",
    },
    "045": {
      short_label: "ZA",
      label: "South Africa",
    },
    "060": {
      short_label: "SS",
      label: "South Sudan",
    },
    "046": {
      short_label: "SD",
      label: "Sudan",
    },
    "047": {
      short_label: "SZ",
      label: "Swaziland",
    },
    "048": {
      short_label: "TZ",
      label: "Tanzania",
    },
    "049": {
      short_label: "TG",
      label: "Togo",
    },
    "051": {
      short_label: "TN",
      label: "Tunisia",
    },
    "052": {
      short_label: "UG",
      label: "Uganda",
    },
    "011": {
      short_label: "KM",
      label: "Union of Comoros",
    },
    "053": {
      short_label: "WS",
      label: "Western Sahara",
    },
    "054": {
      short_label: "ZM",
      label: "Zambia",
    },
    "055": {
      short_label: "ZW",
      label: "Zimbabwe",
    },
    "061": {
      short_label: "SL",
      label: "Somaliland",
    },
    "062": {
      short_label: "BT",
      label: "Bir Tawil",
    },
  },
  [MapTypes.USA]: {
    AL: {
      short_label: "AL",
      label: "Alabama",
    },
    AK: {
      short_label: "AK",
      label: "Alaska",
    },
    AZ: {
      short_label: "AZ",
      label: "Arizona",
    },
    AR: {
      short_label: "AR",
      label: "Arkansas",
    },
    CA: {
      short_label: "CA",
      label: "California",
    },
    CO: {
      short_label: "CO",
      label: "Colorado",
    },
    CT: {
      short_label: "CT",
      label: "Connecticut",
    },
    DE: {
      short_label: "DE",
      label: "Delaware",
    },
    DC: {
      short_label: "DC",
      label: "District of Columbia",
    },
    FL: {
      short_label: "FL",
      label: "Florida",
    },
    GA: {
      short_label: "GA",
      label: "Georgia",
    },
    HI: {
      short_label: "HI",
      label: "Hawaii",
    },
    ID: {
      short_label: "ID",
      label: "Idaho",
    },
    IL: {
      short_label: "IL",
      label: "Illinois",
    },
    IN: {
      short_label: "IN",
      label: "Indiana",
    },
    IA: {
      short_label: "IA",
      label: "Iowa",
    },
    KS: {
      short_label: "KS",
      label: "Kansas",
    },
    KY: {
      short_label: "KY",
      label: "Kentucky",
    },
    LA: {
      short_label: "LA",
      label: "Louisiana",
    },
    ME: {
      short_label: "ME",
      label: "Maine",
    },
    MD: {
      short_label: "MD",
      label: "Maryland",
    },
    MA: {
      short_label: "MA",
      label: "Massachusetts",
    },
    MI: {
      short_label: "MI",
      label: "Michigan",
    },
    MN: {
      short_label: "MN",
      label: "Minnesota",
    },
    MS: {
      short_label: "MS",
      label: "Mississippi",
    },
    MO: {
      short_label: "MO",
      label: "Missouri",
    },
    MT: {
      short_label: "MT",
      label: "Montana",
    },
    NE: {
      short_label: "NE",
      label: "Nebraska",
    },
    NV: {
      short_label: "NV",
      label: "Nevada",
    },
    NH: {
      short_label: "NH",
      label: "New Hampshire",
    },
    NJ: {
      short_label: "NJ",
      label: "New Jersey",
    },
    NM: {
      short_label: "NM",
      label: "New Mexico",
    },
    NY: {
      short_label: "NY",
      label: "New York",
    },
    NC: {
      short_label: "NC",
      label: "North Carolina",
    },
    ND: {
      short_label: "ND",
      label: "North Dakota",
    },
    OH: {
      short_label: "OH",
      label: "Ohio",
    },
    OK: {
      short_label: "OK",
      label: "Oklahoma",
    },
    OR: {
      short_label: "OR",
      label: "Oregon",
    },
    PA: {
      short_label: "PA",
      label: "Pennsylvania",
    },
    RI: {
      short_label: "RI",
      label: "Rhode Island",
    },
    SC: {
      short_label: "SC",
      label: "South Carolina",
    },
    SD: {
      short_label: "SD",
      label: "South Dakota",
    },
    TN: {
      short_label: "TN",
      label: "Tennessee",
    },
    TX: {
      short_label: "TX",
      label: "Texas",
    },
    UT: {
      short_label: "UT",
      label: "Utah",
    },
    VT: {
      short_label: "VT",
      label: "Vermont",
    },
    VA: {
      short_label: "VA",
      label: "Virginia",
    },
    WA: {
      short_label: "WA",
      label: "Washington",
    },
    WV: {
      short_label: "WV",
      label: "West Virginia",
    },
    WI: {
      short_label: "WI",
      label: "Wisconsin",
    },
    WY: {
      short_label: "WY",
      label: "Wyoming",
    },
    PR: {
      short_label: "PR",
      label: "Puerto Rico",
    },
  },
} as Record<MapTypes, Record<string, { short_label: string; label: string }>>;
