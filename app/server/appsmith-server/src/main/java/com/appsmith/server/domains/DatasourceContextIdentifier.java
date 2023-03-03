package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.DatasourceContextIdentifierCE;
import lombok.NoArgsConstructor;

/**
 * This class is for generating keys for dsContext.
 * The object of this class will be used as keys for dsContext
 */
@NoArgsConstructor
public class DatasourceContextIdentifier extends DatasourceContextIdentifierCE {

    public DatasourceContextIdentifier(String datasourceId, String environmentId) {
        super(datasourceId, environmentId);
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
