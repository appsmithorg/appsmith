/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.DatasourceContextIdentifierCE;

import lombok.NoArgsConstructor;

/**
 * This class is for generating keys for dsContext. The object of this class will be used as keys
 * for dsContext
 */
@NoArgsConstructor
public class DatasourceContextIdentifier extends DatasourceContextIdentifierCE {

    public DatasourceContextIdentifier(String datasourceId, String environmentId) {
        super(datasourceId, environmentId);
    }
}
