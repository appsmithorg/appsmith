import Api from "api/Api";

const BASE_URL = "v1/packages";

class PackageApi extends Api {
  static fetchAllPackages() {
    const url = `${BASE_URL}/all`;

    return Api.get(url);
  }
}

export default PackageApi;
