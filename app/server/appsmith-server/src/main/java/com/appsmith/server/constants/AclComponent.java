package com.appsmith.server.constants;

import com.appsmith.external.models.BaseDomain;
import org.springframework.stereotype.Component;

@Component
public class AclComponent<T extends BaseDomain> {

    public String getPermission(Object entity) {
        System.out.println("In the getPermission");
        return "read:applications";
    }
}
