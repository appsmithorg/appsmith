import { CurrencyTypeOptions } from "constants/Currency";
import { countryToFlag } from "./widget/helpers";

const getCurrencyOptions = () => {
  return CurrencyTypeOptions.map((item) => {
    return {
      leftElement: countryToFlag(item.code),
      searchText: item.label,
      label: `${item.currency} - ${item.currency_name}`,
      value: item.currency,
      id: item.symbol_native,
    };
  });
};

export const CurrencyDropdownOptions = getCurrencyOptions();

export const getDefaultCurrency = () => {
  return {
    code: "US",
    currency: "USD",
    currency_name: "United States Dollar",
    label: "United States",
    phone: "1",
    symbol_native: "$",
  };
};
