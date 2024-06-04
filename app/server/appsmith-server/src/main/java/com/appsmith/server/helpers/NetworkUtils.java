package com.appsmith.server.helpers;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.helpers.ce.NetworkUtilsCE;
import org.springframework.stereotype.Component;

@Component
public class NetworkUtils extends NetworkUtilsCE {
    public NetworkUtils(CloudServicesConfig cloudServicesConfig) {
        super(cloudServicesConfig);
    }
}
