package com.appsmith.server.domains.ce;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TenantConfigurationCE {

    private String googleMapsKey;

    private List<String> thirdPartyAuths;

    public void addThirdPartyAuth(String auth) {
        if (thirdPartyAuths == null) {
            thirdPartyAuths = new ArrayList<>();
        }
        thirdPartyAuths.add(auth);
    }

}
