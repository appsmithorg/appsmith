package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.Tenant;

public class TenantUtilsCE {

    public static Tenant removeRestrictedFieldFromClientUpdate(Tenant tenant) {
        tenant.setSlug(null);
        return tenant;
    }

}
