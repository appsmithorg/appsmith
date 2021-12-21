import { ConfigFactory } from "./ConfigFactory";

import GeneralConfig from "./general";
import EmailConfig from "./email";
import MapsConfig from "./googleMaps";
import VersionConfig from "./version";
import AdvancedConfig from "./advanced";
import Authentication from "@appsmith/pages/AdminSettings/config/authentication";

ConfigFactory.register(GeneralConfig);
ConfigFactory.register(EmailConfig);
ConfigFactory.register(MapsConfig);
ConfigFactory.register(Authentication);
ConfigFactory.register(AdvancedConfig);
ConfigFactory.register(VersionConfig);

export default ConfigFactory;
