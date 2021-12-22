import { ConfigFactory } from "./ConfigFactory";

import { config as GeneralConfig } from "./general";
import { config as EmailConfig } from "./email";
import { config as MapsConfig } from "./googleMaps";
import { config as VersionConfig } from "./version";
import { config as AdvancedConfig } from "./advanced";
import { config as Authentication } from "@appsmith/pages/AdminSettings/config/authentication";

ConfigFactory.register(GeneralConfig);
ConfigFactory.register(EmailConfig);
ConfigFactory.register(MapsConfig);
ConfigFactory.register(Authentication);
ConfigFactory.register(AdvancedConfig);
ConfigFactory.register(VersionConfig);

export default ConfigFactory;
