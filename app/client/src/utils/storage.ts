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

export const setRouteBeforeLogin = (path: string | null) => {
  store.setItem(STORAGE_KEYS.ROUTE_BEFORE_LOGIN, path).catch(error => {
    console.log("Unable to set last path");
  });
};

export const getRouteBeforeLogin = async () => {
  const routeBeforeLogin: string = await store.getItem(
    STORAGE_KEYS.ROUTE_BEFORE_LOGIN,
  );
  if (routeBeforeLogin && routeBeforeLogin.length > 0) {
    setRouteBeforeLogin(null);
    return routeBeforeLogin;
  }
  return;
};
