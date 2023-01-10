package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.DsContextMapKeyCE;
/**
 * This class is for generating keys for dsContext.
 * The object of this class will be used as keys for dsContext
 */
public class DsContextMapKey extends DsContextMapKeyCE {

    public DsContextMapKey(String datasourceId, String environmentId) {
        super(datasourceId, environmentId);
    }

    public DsContextMapKey() {
        // empty constructor
    }


    @Override
    public boolean equals(Object obj) {
        // since the usage of environmentId will be mandatory in the EE version,
        // this will have override in the EE version, which will not allow null EE values.
        return super.equals(obj);
    }

    @Override
    public int hashCode() {
        return super.hashCode();
    }

}
