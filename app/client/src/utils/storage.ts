import localforage from "localforage";
import moment from "moment";

const STORAGE_KEYS: { [id: string]: string } = {
  AUTH_EXPIRATION: "Auth.expiration",
  ROUTE_BEFORE_LOGIN: "RedirectPath",
};

const store = localforage.createInstance({
  name: "Appsmith",
});

export const resetAuthExpiration = () => {
  const expireBy = moment()
    .add(1, "h")
    .format();
  store.setItem(STORAGE_KEYS.AUTH_EXPIRATION, expireBy).catch(error => {
    console.log("Unable to set expiration time");
  });
};

export const hasAuthExpired = async () => {
  const expireBy: string = await store.getItem(STORAGE_KEYS.AUTH_EXPIRATION);
  if (expireBy && moment().isAfter(moment(expireBy))) {
    return true;
  }
  return false;
};
