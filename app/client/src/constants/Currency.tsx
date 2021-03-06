// 20210608001520
// https://gist.githubusercontent.com/somangshu/93c83900714d14fe86502be6c48738c7/raw/5ebdc149d599f5661d2c87c59f23d6889cc93129/country.json

export interface CurrencyOptionProps {
  code: string;
  currency: string;
  currency_name: string;
  label: string;
  phone: string;
  symbol_native: string;
}

export const CurrencyTypeOptions: Array<CurrencyOptionProps> = [
  {
    code: "AD",
    currency: "EUR",
    currency_name: "Euro",
    label: "Andorra",
    phone: "376",
    symbol_native: "€",
  },
  {
    code: "AE",
    currency: "AED",
    currency_name: "United Arab Emirates Dirham",
    label: "United Arab Emirates",
    phone: "971",
    symbol_native: "د.إ.‏",
  },
  {
    code: "AF",
    currency: "AFN",
    currency_name: "Afghan Afghani",
    label: "Afghanistan",
    phone: "93",
    symbol_native: "؋",
  },
  // {
  //   code: "AG",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Antigua and Barbuda",
  //   phone: "1-268",
  //   symbol_native: null,
  // },
  // {
  //   code: "AI",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Anguilla",
  //   phone: "1-264",
  //   symbol_native: null,
  // },
  {
    code: "AL",
    currency: "ALL",
    currency_name: "Albanian Lek",
    label: "Albania",
    phone: "355",
    symbol_native: "Lek",
  },
  {
    code: "AM",
    currency: "AMD",
    currency_name: "Armenian Dram",
    label: "Armenia",
    phone: "374",
    symbol_native: "դր.",
  },
  // {
  //   code: "AO",
  //   currency: "AOA",
  //   currency_name: null,
  //   label: "Angola",
  //   phone: "244",
  //   symbol_native: null,
  // },
  // {
  //   code: "AQ",
  //   currency: "",
  //   currency_name: null,
  //   label: "Antarctica",
  //   phone: "672",
  //   symbol_native: null,
  // },
  {
    code: "AR",
    currency: "ARS",
    currency_name: "Argentine Peso",
    label: "Argentina",
    phone: "54",
    symbol_native: "$",
  },
  {
    code: "AS",
    currency: "USD",
    currency_name: "US Dollar",
    label: "American Samoa",
    phone: "1-684",
    symbol_native: "$",
  },
  {
    code: "AT",
    currency: "EUR",
    currency_name: "Euro",
    label: "Austria",
    phone: "43",
    symbol_native: "€",
  },
  {
    code: "AU",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Australia",
    phone: "61",
    symbol_native: "$",
  },
  // {
  //   code: "AW",
  //   currency: "AWG",
  //   currency_name: null,
  //   label: "Aruba",
  //   phone: "297",
  //   symbol_native: null,
  // },
  {
    code: "AX",
    currency: "EUR",
    currency_name: "Euro",
    label: "Alland Islands",
    phone: "358",
    symbol_native: "€",
  },
  {
    code: "AZ",
    currency: "AZN",
    currency_name: "Azerbaijani Manat",
    label: "Azerbaijan",
    phone: "994",
    symbol_native: "ман.",
  },
  {
    code: "BA",
    currency: "BAM",
    currency_name: "Bosnia-Herzegovina Convertible Mark",
    label: "Bosnia and Herzegovina",
    phone: "387",
    symbol_native: "KM",
  },
  // {
  //   code: "BB",
  //   currency: "BBD",
  //   currency_name: null,
  //   label: "Barbados",
  //   phone: "1-246",
  //   symbol_native: null,
  // },
  {
    code: "BD",
    currency: "BDT",
    currency_name: "Bangladeshi Taka",
    label: "Bangladesh",
    phone: "880",
    symbol_native: "৳",
  },
  {
    code: "BE",
    currency: "EUR",
    currency_name: "Euro",
    label: "Belgium",
    phone: "32",
    symbol_native: "€",
  },
  {
    code: "BF",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Burkina Faso",
    phone: "226",
    symbol_native: "CFA",
  },
  {
    code: "BG",
    currency: "BGN",
    currency_name: "Bulgarian Lev",
    label: "Bulgaria",
    phone: "359",
    symbol_native: "лв.",
  },
  {
    code: "BH",
    currency: "BHD",
    currency_name: "Bahraini Dinar",
    label: "Bahrain",
    phone: "973",
    symbol_native: "د.ب.‏",
  },
  {
    code: "BI",
    currency: "BIF",
    currency_name: "Burundian Franc",
    label: "Burundi",
    phone: "257",
    symbol_native: "FBu",
  },
  {
    code: "BJ",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Benin",
    phone: "229",
    symbol_native: "CFA",
  },
  {
    code: "BL",
    currency: "EUR",
    currency_name: "Euro",
    label: "Saint Barthelemy",
    phone: "590",
    symbol_native: "€",
  },
  // {
  //   code: "BM",
  //   currency: "BMD",
  //   currency_name: null,
  //   label: "Bermuda",
  //   phone: "1-441",
  //   symbol_native: null,
  // },
  {
    code: "BN",
    currency: "BND",
    currency_name: "Brunei Dollar",
    label: "Brunei Darussalam",
    phone: "673",
    symbol_native: "$",
  },
  {
    code: "BO",
    currency: "BOB",
    currency_name: "Bolivian Boliviano",
    label: "Bolivia",
    phone: "591",
    symbol_native: "Bs",
  },
  {
    code: "BR",
    currency: "BRL",
    currency_name: "Brazilian Real",
    label: "Brazil",
    phone: "55",
    symbol_native: "R$",
  },
  // {
  //   code: "BS",
  //   currency: "BSD",
  //   currency_name: null,
  //   label: "Bahamas",
  //   phone: "1-242",
  //   symbol_native: null,
  // },
  // {
  //   code: "BT",
  //   currency: "BTN",
  //   currency_name: null,
  //   label: "Bhutan",
  //   phone: "975",
  //   symbol_native: null,
  // },
  {
    code: "BV",
    currency: "NOK",
    currency_name: "Norwegian Krone",
    label: "Bouvet Island",
    phone: "47",
    symbol_native: "kr",
  },
  {
    code: "BW",
    currency: "BWP",
    currency_name: "Botswanan Pula",
    label: "Botswana",
    phone: "267",
    symbol_native: "P",
  },
  {
    code: "BY",
    currency: "BYR",
    currency_name: "Belarusian Ruble",
    label: "Belarus",
    phone: "375",
    symbol_native: "BYR",
  },
  {
    code: "BZ",
    currency: "BZD",
    currency_name: "Belize Dollar",
    label: "Belize",
    phone: "501",
    symbol_native: "$",
  },
  {
    code: "CA",
    currency: "CAD",
    currency_name: "Canadian Dollar",
    label: "Canada",
    phone: "1",
    symbol_native: "$",
  },
  {
    code: "CC",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Cocos (Keeling) Islands",
    phone: "61",
    symbol_native: "$",
  },
  {
    code: "CD",
    currency: "CDF",
    currency_name: "Congolese Franc",
    label: "Congo, Democratic Republic of the",
    phone: "243",
    symbol_native: "FrCD",
  },
  {
    code: "CF",
    currency: "XAF",
    currency_name: "CFA Franc BEAC",
    label: "Central African Republic",
    phone: "236",
    symbol_native: "FCFA",
  },
  {
    code: "CG",
    currency: "XAF",
    currency_name: "CFA Franc BEAC",
    label: "Congo, Republic of the",
    phone: "242",
    symbol_native: "FCFA",
  },
  {
    code: "CH",
    currency: "CHF",
    currency_name: "Swiss Franc",
    label: "Switzerland",
    phone: "41",
    symbol_native: "CHF",
  },
  {
    code: "CI",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Cote d'Ivoire",
    phone: "225",
    symbol_native: "CFA",
  },
  {
    code: "CK",
    currency: "NZD",
    currency_name: "New Zealand Dollar",
    label: "Cook Islands",
    phone: "682",
    symbol_native: "$",
  },
  {
    code: "CL",
    currency: "CLP",
    currency_name: "Chilean Peso",
    label: "Chile",
    phone: "56",
    symbol_native: "$",
  },
  {
    code: "CM",
    currency: "XAF",
    currency_name: "CFA Franc BEAC",
    label: "Cameroon",
    phone: "237",
    symbol_native: "FCFA",
  },
  {
    code: "CN",
    currency: "CNY",
    currency_name: "Chinese Yuan",
    label: "China",
    phone: "86",
    symbol_native: "CN¥",
  },
  {
    code: "CO",
    currency: "COP",
    currency_name: "Colombian Peso",
    label: "Colombia",
    phone: "57",
    symbol_native: "$",
  },
  {
    code: "CR",
    currency: "CRC",
    currency_name: "Costa Rican Colón",
    label: "Costa Rica",
    phone: "506",
    symbol_native: "₡",
  },
  // {
  //   code: "CU",
  //   currency: "CUP",
  //   currency_name: null,
  //   label: "Cuba",
  //   phone: "53",
  //   symbol_native: null,
  // },
  {
    code: "CV",
    currency: "CVE",
    currency_name: "Cape Verdean Escudo",
    label: "Cape Verde",
    phone: "238",
    symbol_native: "CV$",
  },
  // {
  //   code: "CW",
  //   currency: "ANG",
  //   currency_name: null,
  //   label: "Curacao",
  //   phone: "599",
  //   symbol_native: null,
  // },
  {
    code: "CX",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Christmas Island",
    phone: "61",
    symbol_native: "$",
  },
  {
    code: "CY",
    currency: "EUR",
    currency_name: "Euro",
    label: "Cyprus",
    phone: "357",
    symbol_native: "€",
  },
  {
    code: "CZ",
    currency: "CZK",
    currency_name: "Czech Republic Koruna",
    label: "Czech Republic",
    phone: "420",
    symbol_native: "Kč",
  },
  {
    code: "DE",
    currency: "EUR",
    currency_name: "Euro",
    label: "Germany",
    phone: "49",
    symbol_native: "€",
  },
  {
    code: "DJ",
    currency: "DJF",
    currency_name: "Djiboutian Franc",
    label: "Djibouti",
    phone: "253",
    symbol_native: "Fdj",
  },
  {
    code: "DK",
    currency: "DKK",
    currency_name: "Danish Krone",
    label: "Denmark",
    phone: "45",
    symbol_native: "kr",
  },
  // {
  //   code: "DM",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Dominica",
  //   phone: "1-767",
  //   symbol_native: null,
  // },
  {
    code: "DO",
    currency: "DOP",
    currency_name: "Dominican Peso",
    label: "Dominican Republic",
    phone: "1-809",
    symbol_native: "RD$",
  },
  {
    code: "DZ",
    currency: "DZD",
    currency_name: "Algerian Dinar",
    label: "Algeria",
    phone: "213",
    symbol_native: "د.ج.‏",
  },
  {
    code: "EC",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Ecuador",
    phone: "593",
    symbol_native: "$",
  },
  {
    code: "EE",
    currency: "EUR",
    currency_name: "Euro",
    label: "Estonia",
    phone: "372",
    symbol_native: "€",
  },
  {
    code: "EG",
    currency: "EGP",
    currency_name: "Egyptian Pound",
    label: "Egypt",
    phone: "20",
    symbol_native: "ج.م.‏",
  },
  {
    code: "EH",
    currency: "MAD",
    currency_name: "Moroccan Dirham",
    label: "Western Sahara",
    phone: "212",
    symbol_native: "د.م.‏",
  },
  {
    code: "ER",
    currency: "ERN",
    currency_name: "Eritrean Nakfa",
    label: "Eritrea",
    phone: "291",
    symbol_native: "Nfk",
  },
  {
    code: "ES",
    currency: "EUR",
    currency_name: "Euro",
    label: "Spain",
    phone: "34",
    symbol_native: "€",
  },
  {
    code: "ET",
    currency: "ETB",
    currency_name: "Ethiopian Birr",
    label: "Ethiopia",
    phone: "251",
    symbol_native: "Br",
  },
  {
    code: "FI",
    currency: "EUR",
    currency_name: "Euro",
    label: "Finland",
    phone: "358",
    symbol_native: "€",
  },
  // {
  //   code: "FJ",
  //   currency: "FJD",
  //   currency_name: null,
  //   label: "Fiji",
  //   phone: "679",
  //   symbol_native: null,
  // },
  // {
  //   code: "FK",
  //   currency: "FKP",
  //   currency_name: null,
  //   label: "Falkland Islands (Malvinas)",
  //   phone: "500",
  //   symbol_native: null,
  // },
  {
    code: "FM",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Micronesia, Federated States of",
    phone: "691",
    symbol_native: "$",
  },
  {
    code: "FO",
    currency: "DKK",
    currency_name: "Danish Krone",
    label: "Faroe Islands",
    phone: "298",
    symbol_native: "kr",
  },
  {
    code: "FR",
    currency: "EUR",
    currency_name: "Euro",
    label: "France",
    phone: "33",
    symbol_native: "€",
  },
  {
    code: "GA",
    currency: "XAF",
    currency_name: "CFA Franc BEAC",
    label: "Gabon",
    phone: "241",
    symbol_native: "FCFA",
  },
  {
    code: "GB",
    currency: "GBP",
    currency_name: "British Pound Sterling",
    label: "United Kingdom",
    phone: "44",
    symbol_native: "£",
  },
  // {
  //   code: "GD",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Grenada",
  //   phone: "1-473",
  //   symbol_native: null,
  // },
  {
    code: "GE",
    currency: "GEL",
    currency_name: "Georgian Lari",
    label: "Georgia",
    phone: "995",
    symbol_native: "GEL",
  },
  {
    code: "GF",
    currency: "EUR",
    currency_name: "Euro",
    label: "French Guiana",
    phone: "594",
    symbol_native: "€",
  },
  {
    code: "GG",
    currency: "GBP",
    currency_name: "British Pound Sterling",
    label: "Guernsey",
    phone: "44",
    symbol_native: "£",
  },
  {
    code: "GH",
    currency: "GHS",
    currency_name: "Ghanaian Cedi",
    label: "Ghana",
    phone: "233",
    symbol_native: "GH₵",
  },
  // {
  //   code: "GI",
  //   currency: "GIP",
  //   currency_name: null,
  //   label: "Gibraltar",
  //   phone: "350",
  //   symbol_native: null,
  // },
  {
    code: "GL",
    currency: "DKK",
    currency_name: "Danish Krone",
    label: "Greenland",
    phone: "299",
    symbol_native: "kr",
  },
  // {
  //   code: "GM",
  //   currency: "GMD",
  //   currency_name: null,
  //   label: "Gambia",
  //   phone: "220",
  //   symbol_native: null,
  // },
  {
    code: "GN",
    currency: "GNF",
    currency_name: "Guinean Franc",
    label: "Guinea",
    phone: "224",
    symbol_native: "FG",
  },
  {
    code: "GP",
    currency: "EUR",
    currency_name: "Euro",
    label: "Guadeloupe",
    phone: "590",
    symbol_native: "€",
  },
  {
    code: "GQ",
    currency: "XAF",
    currency_name: "CFA Franc BEAC",
    label: "Equatorial Guinea",
    phone: "240",
    symbol_native: "FCFA",
  },
  {
    code: "GR",
    currency: "EUR",
    currency_name: "Euro",
    label: "Greece",
    phone: "30",
    symbol_native: "€",
  },
  {
    code: "GS",
    currency: "GBP",
    currency_name: "British Pound Sterling",
    label: "South Georgia and the South Sandwich Islands",
    phone: "500",
    symbol_native: "£",
  },
  {
    code: "GT",
    currency: "GTQ",
    currency_name: "Guatemalan Quetzal",
    label: "Guatemala",
    phone: "502",
    symbol_native: "Q",
  },
  {
    code: "GU",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Guam",
    phone: "1-671",
    symbol_native: "$",
  },
  {
    code: "GW",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Guinea-Bissau",
    phone: "245",
    symbol_native: "CFA",
  },
  // {
  //   code: "GY",
  //   currency: "GYD",
  //   currency_name: null,
  //   label: "Guyana",
  //   phone: "592",
  //   symbol_native: null,
  // },
  {
    code: "HK",
    currency: "HKD",
    currency_name: "Hong Kong Dollar",
    label: "Hong Kong",
    phone: "852",
    symbol_native: "$",
  },
  {
    code: "HM",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Heard Island and McDonald Islands",
    phone: "672",
    symbol_native: "$",
  },
  {
    code: "HN",
    currency: "HNL",
    currency_name: "Honduran Lempira",
    label: "Honduras",
    phone: "504",
    symbol_native: "L",
  },
  {
    code: "HR",
    currency: "HRK",
    currency_name: "Croatian Kuna",
    label: "Croatia",
    phone: "385",
    symbol_native: "kn",
  },
  // {
  //   code: "HT",
  //   currency: "HTG",
  //   currency_name: null,
  //   label: "Haiti",
  //   phone: "509",
  //   symbol_native: null,
  // },
  {
    code: "HU",
    currency: "HUF",
    currency_name: "Hungarian Forint",
    label: "Hungary",
    phone: "36",
    symbol_native: "Ft",
  },
  {
    code: "ID",
    currency: "IDR",
    currency_name: "Indonesian Rupiah",
    label: "Indonesia",
    phone: "62",
    symbol_native: "Rp",
  },
  {
    code: "IE",
    currency: "EUR",
    currency_name: "Euro",
    label: "Ireland",
    phone: "353",
    symbol_native: "€",
  },
  {
    code: "IL",
    currency: "ILS",
    currency_name: "Israeli New Sheqel",
    label: "Israel",
    phone: "972",
    symbol_native: "₪",
  },
  {
    code: "IM",
    currency: "GBP",
    currency_name: "British Pound Sterling",
    label: "Isle of Man",
    phone: "44",
    symbol_native: "£",
  },
  {
    code: "IN",
    currency: "INR",
    currency_name: "Indian Rupee",
    label: "India",
    phone: "91",
    symbol_native: "₹",
  },
  {
    code: "IO",
    currency: "USD",
    currency_name: "US Dollar",
    label: "British Indian Ocean Territory",
    phone: "246",
    symbol_native: "$",
  },
  {
    code: "IQ",
    currency: "IQD",
    currency_name: "Iraqi Dinar",
    label: "Iraq",
    phone: "964",
    symbol_native: "د.ع.‏",
  },
  {
    code: "IR",
    currency: "IRR",
    currency_name: "Iranian Rial",
    label: "Iran, Islamic Republic of",
    phone: "98",
    symbol_native: "﷼",
  },
  {
    code: "IS",
    currency: "ISK",
    currency_name: "Icelandic Króna",
    label: "Iceland",
    phone: "354",
    symbol_native: "kr",
  },
  {
    code: "IT",
    currency: "EUR",
    currency_name: "Euro",
    label: "Italy",
    phone: "39",
    symbol_native: "€",
  },
  {
    code: "JE",
    currency: "GBP",
    currency_name: "British Pound Sterling",
    label: "Jersey",
    phone: "44",
    symbol_native: "£",
  },
  {
    code: "JM",
    currency: "JMD",
    currency_name: "Jamaican Dollar",
    label: "Jamaica",
    phone: "1-876",
    symbol_native: "$",
  },
  {
    code: "JO",
    currency: "JOD",
    currency_name: "Jordanian Dinar",
    label: "Jordan",
    phone: "962",
    symbol_native: "د.أ.‏",
  },
  {
    code: "JP",
    currency: "JPY",
    currency_name: "Japanese Yen",
    label: "Japan",
    phone: "81",
    symbol_native: "￥",
  },
  {
    code: "KE",
    currency: "KES",
    currency_name: "Kenyan Shilling",
    label: "Kenya",
    phone: "254",
    symbol_native: "Ksh",
  },
  // {
  //   code: "KG",
  //   currency: "KGS",
  //   currency_name: null,
  //   label: "Kyrgyzstan",
  //   phone: "996",
  //   symbol_native: null,
  // },
  {
    code: "KH",
    currency: "KHR",
    currency_name: "Cambodian Riel",
    label: "Cambodia",
    phone: "855",
    symbol_native: "៛",
  },
  {
    code: "KI",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Kiribati",
    phone: "686",
    symbol_native: "$",
  },
  {
    code: "KM",
    currency: "KMF",
    currency_name: "Comorian Franc",
    label: "Comoros",
    phone: "269",
    symbol_native: "FC",
  },
  // {
  //   code: "KN",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Saint Kitts and Nevis",
  //   phone: "1-869",
  //   symbol_native: null,
  // },
  // {
  //   code: "KP",
  //   currency: "KPW",
  //   currency_name: null,
  //   label: "Korea, Democratic People's Republic of",
  //   phone: "850",
  //   symbol_native: null,
  // },
  {
    code: "KR",
    currency: "KRW",
    currency_name: "South Korean Won",
    label: "Korea, Republic of",
    phone: "82",
    symbol_native: "₩",
  },
  {
    code: "KW",
    currency: "KWD",
    currency_name: "Kuwaiti Dinar",
    label: "Kuwait",
    phone: "965",
    symbol_native: "د.ك.‏",
  },
  // {
  //   code: "KY",
  //   currency: "KYD",
  //   currency_name: null,
  //   label: "Cayman Islands",
  //   phone: "1-345",
  //   symbol_native: null,
  // },
  {
    code: "KZ",
    currency: "KZT",
    currency_name: "Kazakhstani Tenge",
    label: "Kazakhstan",
    phone: "7",
    symbol_native: "тңг.",
  },
  // {
  //   code: "LA",
  //   currency: "LAK",
  //   currency_name: null,
  //   label: "Lao People's Democratic Republic",
  //   phone: "856",
  //   symbol_native: null,
  // },
  {
    code: "LB",
    currency: "LBP",
    currency_name: "Lebanese Pound",
    label: "Lebanon",
    phone: "961",
    symbol_native: "ل.ل.‏",
  },
  // {
  //   code: "LC",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Saint Lucia",
  //   phone: "1-758",
  //   symbol_native: null,
  // },
  {
    code: "LI",
    currency: "CHF",
    currency_name: "Swiss Franc",
    label: "Liechtenstein",
    phone: "423",
    symbol_native: "CHF",
  },
  {
    code: "LK",
    currency: "LKR",
    currency_name: "Sri Lankan Rupee",
    label: "Sri Lanka",
    phone: "94",
    symbol_native: "SL Re",
  },
  // {
  //   code: "LR",
  //   currency: "LRD",
  //   currency_name: null,
  //   label: "Liberia",
  //   phone: "231",
  //   symbol_native: null,
  // },
  // {
  //   code: "LS",
  //   currency: "LSL",
  //   currency_name: null,
  //   label: "Lesotho",
  //   phone: "266",
  //   symbol_native: null,
  // },
  {
    code: "LT",
    currency: "LTL",
    currency_name: "Lithuanian Litas",
    label: "Lithuania",
    phone: "370",
    symbol_native: "Lt",
  },
  {
    code: "LU",
    currency: "EUR",
    currency_name: "Euro",
    label: "Luxembourg",
    phone: "352",
    symbol_native: "€",
  },
  {
    code: "LV",
    currency: "EUR",
    currency_name: "Euro",
    label: "Latvia",
    phone: "371",
    symbol_native: "€",
  },
  {
    code: "LY",
    currency: "LYD",
    currency_name: "Libyan Dinar",
    label: "Libya",
    phone: "218",
    symbol_native: "د.ل.‏",
  },
  {
    code: "MA",
    currency: "MAD",
    currency_name: "Moroccan Dirham",
    label: "Morocco",
    phone: "212",
    symbol_native: "د.م.‏",
  },
  {
    code: "MC",
    currency: "EUR",
    currency_name: "Euro",
    label: "Monaco",
    phone: "377",
    symbol_native: "€",
  },
  {
    code: "MD",
    currency: "MDL",
    currency_name: "Moldovan Leu",
    label: "Moldova, Republic of",
    phone: "373",
    symbol_native: "MDL",
  },
  {
    code: "ME",
    currency: "EUR",
    currency_name: "Euro",
    label: "Montenegro",
    phone: "382",
    symbol_native: "€",
  },
  {
    code: "MF",
    currency: "EUR",
    currency_name: "Euro",
    label: "Saint Martin (French part)",
    phone: "590",
    symbol_native: "€",
  },
  {
    code: "MG",
    currency: "MGA",
    currency_name: "Malagasy Ariary",
    label: "Madagascar",
    phone: "261",
    symbol_native: "MGA",
  },
  {
    code: "MH",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Marshall Islands",
    phone: "692",
    symbol_native: "$",
  },
  {
    code: "MK",
    currency: "MKD",
    currency_name: "Macedonian Denar",
    label: "Macedonia, the Former Yugoslav Republic of",
    phone: "389",
    symbol_native: "MKD",
  },
  {
    code: "ML",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Mali",
    phone: "223",
    symbol_native: "CFA",
  },
  {
    code: "MM",
    currency: "MMK",
    currency_name: "Myanma Kyat",
    label: "Myanmar",
    phone: "95",
    symbol_native: "K",
  },
  // {
  //   code: "MN",
  //   currency: "MNT",
  //   currency_name: null,
  //   label: "Mongolia",
  //   phone: "976",
  //   symbol_native: null,
  // },
  {
    code: "MO",
    currency: "MOP",
    currency_name: "Macanese Pataca",
    label: "Macao",
    phone: "853",
    symbol_native: "MOP$",
  },
  {
    code: "MP",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Northern Mariana Islands",
    phone: "1-670",
    symbol_native: "$",
  },
  {
    code: "MQ",
    currency: "EUR",
    currency_name: "Euro",
    label: "Martinique",
    phone: "596",
    symbol_native: "€",
  },
  // {
  //   code: "MR",
  //   currency: "MRO",
  //   currency_name: null,
  //   label: "Mauritania",
  //   phone: "222",
  //   symbol_native: null,
  // },
  // {
  //   code: "MS",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Montserrat",
  //   phone: "1-664",
  //   symbol_native: null,
  // },
  {
    code: "MT",
    currency: "EUR",
    currency_name: "Euro",
    label: "Malta",
    phone: "356",
    symbol_native: "€",
  },
  {
    code: "MU",
    currency: "MUR",
    currency_name: "Mauritian Rupee",
    label: "Mauritius",
    phone: "230",
    symbol_native: "MURs",
  },
  // {
  //   code: "MV",
  //   currency: "MVR",
  //   currency_name: null,
  //   label: "Maldives",
  //   phone: "960",
  //   symbol_native: null,
  // },
  // {
  //   code: "MW",
  //   currency: "MWK",
  //   currency_name: null,
  //   label: "Malawi",
  //   phone: "265",
  //   symbol_native: null,
  // },
  {
    code: "MX",
    currency: "MXN",
    currency_name: "Mexican Peso",
    label: "Mexico",
    phone: "52",
    symbol_native: "$",
  },
  {
    code: "MY",
    currency: "MYR",
    currency_name: "Malaysian Ringgit",
    label: "Malaysia",
    phone: "60",
    symbol_native: "RM",
  },
  {
    code: "MZ",
    currency: "MZN",
    currency_name: "Mozambican Metical",
    label: "Mozambique",
    phone: "258",
    symbol_native: "MTn",
  },
  {
    code: "NA",
    currency: "NAD",
    currency_name: "Namibian Dollar",
    label: "Namibia",
    phone: "264",
    symbol_native: "N$",
  },
  // {
  //   code: "NC",
  //   currency: "XPF",
  //   currency_name: null,
  //   label: "New Caledonia",
  //   phone: "687",
  //   symbol_native: null,
  // },
  {
    code: "NE",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Niger",
    phone: "227",
    symbol_native: "CFA",
  },
  {
    code: "NF",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Norfolk Island",
    phone: "672",
    symbol_native: "$",
  },
  {
    code: "NG",
    currency: "NGN",
    currency_name: "Nigerian Naira",
    label: "Nigeria",
    phone: "234",
    symbol_native: "₦",
  },
  {
    code: "NI",
    currency: "NIO",
    currency_name: "Nicaraguan Córdoba",
    label: "Nicaragua",
    phone: "505",
    symbol_native: "C$",
  },
  {
    code: "NL",
    currency: "EUR",
    currency_name: "Euro",
    label: "Netherlands",
    phone: "31",
    symbol_native: "€",
  },
  {
    code: "NO",
    currency: "NOK",
    currency_name: "Norwegian Krone",
    label: "Norway",
    phone: "47",
    symbol_native: "kr",
  },
  {
    code: "NP",
    currency: "NPR",
    currency_name: "Nepalese Rupee",
    label: "Nepal",
    phone: "977",
    symbol_native: "नेरू",
  },
  {
    code: "NR",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Nauru",
    phone: "674",
    symbol_native: "$",
  },
  {
    code: "NU",
    currency: "NZD",
    currency_name: "New Zealand Dollar",
    label: "Niue",
    phone: "683",
    symbol_native: "$",
  },
  {
    code: "NZ",
    currency: "NZD",
    currency_name: "New Zealand Dollar",
    label: "New Zealand",
    phone: "64",
    symbol_native: "$",
  },
  {
    code: "OM",
    currency: "OMR",
    currency_name: "Omani Rial",
    label: "Oman",
    phone: "968",
    symbol_native: "ر.ع.‏",
  },
  {
    code: "PA",
    currency: "PAB",
    currency_name: "Panamanian Balboa",
    label: "Panama",
    phone: "507",
    symbol_native: "B/.",
  },
  {
    code: "PE",
    currency: "PEN",
    currency_name: "Peruvian Nuevo Sol",
    label: "Peru",
    phone: "51",
    symbol_native: "S/.",
  },
  // {
  //   code: "PF",
  //   currency: "XPF",
  //   currency_name: null,
  //   label: "French Polynesia",
  //   phone: "689",
  //   symbol_native: null,
  // },
  // {
  //   code: "PG",
  //   currency: "PGK",
  //   currency_name: null,
  //   label: "Papua New Guinea",
  //   phone: "675",
  //   symbol_native: null,
  // },
  {
    code: "PH",
    currency: "PHP",
    currency_name: "Philippine Peso",
    label: "Philippines",
    phone: "63",
    symbol_native: "₱",
  },
  {
    code: "PK",
    currency: "PKR",
    currency_name: "Pakistani Rupee",
    label: "Pakistan",
    phone: "92",
    symbol_native: "₨",
  },
  {
    code: "PL",
    currency: "PLN",
    currency_name: "Polish Zloty",
    label: "Poland",
    phone: "48",
    symbol_native: "zł",
  },
  {
    code: "PM",
    currency: "EUR",
    currency_name: "Euro",
    label: "Saint Pierre and Miquelon",
    phone: "508",
    symbol_native: "€",
  },
  {
    code: "PN",
    currency: "NZD",
    currency_name: "New Zealand Dollar",
    label: "Pitcairn",
    phone: "870",
    symbol_native: "$",
  },
  {
    code: "PR",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Puerto Rico",
    phone: "1",
    symbol_native: "$",
  },
  {
    code: "PS",
    currency: "ILS",
    currency_name: "Israeli New Sheqel",
    label: "Palestine, State of",
    phone: "970",
    symbol_native: "₪",
  },
  {
    code: "PT",
    currency: "EUR",
    currency_name: "Euro",
    label: "Portugal",
    phone: "351",
    symbol_native: "€",
  },
  {
    code: "PW",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Palau",
    phone: "680",
    symbol_native: "$",
  },
  {
    code: "PY",
    currency: "PYG",
    currency_name: "Paraguayan Guarani",
    label: "Paraguay",
    phone: "595",
    symbol_native: "₲",
  },
  {
    code: "QA",
    currency: "QAR",
    currency_name: "Qatari Rial",
    label: "Qatar",
    phone: "974",
    symbol_native: "ر.ق.‏",
  },
  {
    code: "RE",
    currency: "EUR",
    currency_name: "Euro",
    label: "Reunion",
    phone: "262",
    symbol_native: "€",
  },
  {
    code: "RO",
    currency: "RON",
    currency_name: "Romanian Leu",
    label: "Romania",
    phone: "40",
    symbol_native: "RON",
  },
  {
    code: "RS",
    currency: "RSD",
    currency_name: "Serbian Dinar",
    label: "Serbia",
    phone: "381",
    symbol_native: "дин.",
  },
  {
    code: "RU",
    currency: "RUB",
    currency_name: "Russian Ruble",
    label: "Russian Federation",
    phone: "7",
    symbol_native: "руб.",
  },
  {
    code: "RW",
    currency: "RWF",
    currency_name: "Rwandan Franc",
    label: "Rwanda",
    phone: "250",
    symbol_native: "FR",
  },
  {
    code: "SA",
    currency: "SAR",
    currency_name: "Saudi Riyal",
    label: "Saudi Arabia",
    phone: "966",
    symbol_native: "ر.س.‏",
  },
  // {
  //   code: "SB",
  //   currency: "SBD",
  //   currency_name: null,
  //   label: "Solomon Islands",
  //   phone: "677",
  //   symbol_native: null,
  // },
  // {
  //   code: "SC",
  //   currency: "SCR",
  //   currency_name: null,
  //   label: "Seychelles",
  //   phone: "248",
  //   symbol_native: null,
  // },
  {
    code: "SD",
    currency: "SDG",
    currency_name: "Sudanese Pound",
    label: "Sudan",
    phone: "249",
    symbol_native: "SDG",
  },
  {
    code: "SE",
    currency: "SEK",
    currency_name: "Swedish Krona",
    label: "Sweden",
    phone: "46",
    symbol_native: "kr",
  },
  {
    code: "SG",
    currency: "SGD",
    currency_name: "Singapore Dollar",
    label: "Singapore",
    phone: "65",
    symbol_native: "$",
  },
  // {
  //   code: "SH",
  //   currency: "SHP",
  //   currency_name: null,
  //   label: "Saint Helena",
  //   phone: "290",
  //   symbol_native: null,
  // },
  {
    code: "SI",
    currency: "EUR",
    currency_name: "Euro",
    label: "Slovenia",
    phone: "386",
    symbol_native: "€",
  },
  {
    code: "SJ",
    currency: "NOK",
    currency_name: "Norwegian Krone",
    label: "Svalbard and Jan Mayen",
    phone: "47",
    symbol_native: "kr",
  },
  {
    code: "SK",
    currency: "EUR",
    currency_name: "Euro",
    label: "Slovakia",
    phone: "421",
    symbol_native: "€",
  },
  // {
  //   code: "SL",
  //   currency: "SLL",
  //   currency_name: null,
  //   label: "Sierra Leone",
  //   phone: "232",
  //   symbol_native: null,
  // },
  {
    code: "SM",
    currency: "EUR",
    currency_name: "Euro",
    label: "San Marino",
    phone: "378",
    symbol_native: "€",
  },
  {
    code: "SN",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Senegal",
    phone: "221",
    symbol_native: "CFA",
  },
  {
    code: "SO",
    currency: "SOS",
    currency_name: "Somali Shilling",
    label: "Somalia",
    phone: "252",
    symbol_native: "Ssh",
  },
  // {
  //   code: "SR",
  //   currency: "SRD",
  //   currency_name: null,
  //   label: "Suriname",
  //   phone: "597",
  //   symbol_native: null,
  // },
  // {
  //   code: "SS",
  //   currency: "SSP",
  //   currency_name: null,
  //   label: "South Sudan",
  //   phone: "211",
  //   symbol_native: null,
  // },
  // {
  //   code: "ST",
  //   currency: "STD",
  //   currency_name: null,
  //   label: "Sao Tome and Principe",
  //   phone: "239",
  //   symbol_native: null,
  // },
  {
    code: "SV",
    currency: "USD",
    currency_name: "US Dollar",
    label: "El Salvador",
    phone: "503",
    symbol_native: "$",
  },
  // {
  //   code: "SX",
  //   currency: "ANG",
  //   currency_name: null,
  //   label: "Sint Maarten (Dutch part)",
  //   phone: "1-721",
  //   symbol_native: null,
  // },
  {
    code: "SY",
    currency: "SYP",
    currency_name: "Syrian Pound",
    label: "Syrian Arab Republic",
    phone: "963",
    symbol_native: "ل.س.‏",
  },
  // {
  //   code: "SZ",
  //   currency: "SZL",
  //   currency_name: null,
  //   label: "Swaziland",
  //   phone: "268",
  //   symbol_native: null,
  // },
  {
    code: "TC",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Turks and Caicos Islands",
    phone: "1-649",
    symbol_native: "$",
  },
  {
    code: "TD",
    currency: "XAF",
    currency_name: "CFA Franc BEAC",
    label: "Chad",
    phone: "235",
    symbol_native: "FCFA",
  },
  {
    code: "TF",
    currency: "EUR",
    currency_name: "Euro",
    label: "French Southern Territories",
    phone: "262",
    symbol_native: "€",
  },
  {
    code: "TG",
    currency: "XOF",
    currency_name: "CFA Franc BCEAO",
    label: "Togo",
    phone: "228",
    symbol_native: "CFA",
  },
  {
    code: "TH",
    currency: "THB",
    currency_name: "Thai Baht",
    label: "Thailand",
    phone: "66",
    symbol_native: "฿",
  },
  // {
  //   code: "TJ",
  //   currency: "TJS",
  //   currency_name: null,
  //   label: "Tajikistan",
  //   phone: "992",
  //   symbol_native: null,
  // },
  {
    code: "TK",
    currency: "NZD",
    currency_name: "New Zealand Dollar",
    label: "Tokelau",
    phone: "690",
    symbol_native: "$",
  },
  {
    code: "TL",
    currency: "USD",
    currency_name: "US Dollar",
    label: "Timor-Leste",
    phone: "670",
    symbol_native: "$",
  },
  // {
  //   code: "TM",
  //   currency: "TMT",
  //   currency_name: null,
  //   label: "Turkmenistan",
  //   phone: "993",
  //   symbol_native: null,
  // },
  {
    code: "TN",
    currency: "TND",
    currency_name: "Tunisian Dinar",
    label: "Tunisia",
    phone: "216",
    symbol_native: "د.ت.‏",
  },
  {
    code: "TO",
    currency: "TOP",
    currency_name: "Tongan Paʻanga",
    label: "Tonga",
    phone: "676",
    symbol_native: "T$",
  },
  {
    code: "TR",
    currency: "TRY",
    currency_name: "Turkish Lira",
    label: "Turkey",
    phone: "90",
    symbol_native: "TL",
  },
  {
    code: "TT",
    currency: "TTD",
    currency_name: "Trinidad and Tobago Dollar",
    label: "Trinidad and Tobago",
    phone: "1-868",
    symbol_native: "$",
  },
  {
    code: "TV",
    currency: "AUD",
    currency_name: "Australian Dollar",
    label: "Tuvalu",
    phone: "688",
    symbol_native: "$",
  },
  {
    code: "TW",
    currency: "TWD",
    currency_name: "New Taiwan Dollar",
    label: "Taiwan, Province of China",
    phone: "886",
    symbol_native: "NT$",
  },
  {
    code: "TZ",
    currency: "TZS",
    currency_name: "Tanzanian Shilling",
    label: "United Republic of Tanzania",
    phone: "255",
    symbol_native: "TSh",
  },
  {
    code: "UA",
    currency: "UAH",
    currency_name: "Ukrainian Hryvnia",
    label: "Ukraine",
    phone: "380",
    symbol_native: "₴",
  },
  {
    code: "UG",
    currency: "UGX",
    currency_name: "Ugandan Shilling",
    label: "Uganda",
    phone: "256",
    symbol_native: "USh",
  },
  {
    code: "US",
    currency: "USD",
    currency_name: "US Dollar",
    label: "United States",
    phone: "1",
    symbol_native: "$",
  },
  {
    code: "UY",
    currency: "UYU",
    currency_name: "Uruguayan Peso",
    label: "Uruguay",
    phone: "598",
    symbol_native: "$",
  },
  {
    code: "UZ",
    currency: "UZS",
    currency_name: "Uzbekistan Som",
    label: "Uzbekistan",
    phone: "998",
    symbol_native: "UZS",
  },
  {
    code: "VA",
    currency: "EUR",
    currency_name: "Euro",
    label: "Holy See (Vatican City State)",
    phone: "379",
    symbol_native: "€",
  },
  // {
  //   code: "VC",
  //   currency: "XCD",
  //   currency_name: null,
  //   label: "Saint Vincent and the Grenadines",
  //   phone: "1-784",
  //   symbol_native: null,
  // },
  {
    code: "VE",
    currency: "VEF",
    currency_name: "Venezuelan Bolívar",
    label: "Venezuela",
    phone: "58",
    symbol_native: "Bs.F.",
  },
  {
    code: "VG",
    currency: "USD",
    currency_name: "US Dollar",
    label: "British Virgin Islands",
    phone: "1-284",
    symbol_native: "$",
  },
  {
    code: "VI",
    currency: "USD",
    currency_name: "US Dollar",
    label: "US Virgin Islands",
    phone: "1-340",
    symbol_native: "$",
  },
  {
    code: "VN",
    currency: "VND",
    currency_name: "Vietnamese Dong",
    label: "Vietnam",
    phone: "84",
    symbol_native: "₫",
  },
  // {
  //   code: "VU",
  //   currency: "VUV",
  //   currency_name: null,
  //   label: "Vanuatu",
  //   phone: "678",
  //   symbol_native: null,
  // },
  // {
  //   code: "WF",
  //   currency: "XPF",
  //   currency_name: null,
  //   label: "Wallis and Futuna",
  //   phone: "681",
  //   symbol_native: null,
  // },
  // {
  //   code: "WS",
  //   currency: "WST",
  //   currency_name: null,
  //   label: "Samoa",
  //   phone: "685",
  //   symbol_native: null,
  // },
  {
    code: "XK",
    currency: "EUR",
    currency_name: "Euro",
    label: "Kosovo",
    phone: "383",
    symbol_native: "€",
  },
  {
    code: "YE",
    currency: "YER",
    currency_name: "Yemeni Rial",
    label: "Yemen",
    phone: "967",
    symbol_native: "ر.ي.‏",
  },
  {
    code: "YT",
    currency: "EUR",
    currency_name: "Euro",
    label: "Mayotte",
    phone: "262",
    symbol_native: "€",
  },
  {
    code: "ZA",
    currency: "ZAR",
    currency_name: "South African Rand",
    label: "South Africa",
    phone: "27",
    symbol_native: "R",
  },
  {
    code: "ZM",
    currency: "ZMK",
    currency_name: "Zambian Kwacha",
    label: "Zambia",
    phone: "260",
    symbol_native: "ZK",
  },
  // {
  //   code: "ZW",
  //   currency: "ZWL",
  //   currency_name: null,
  //   label: "Zimbabwe",
  //   phone: "263",
  //   symbol_native: null,
  // },
];
