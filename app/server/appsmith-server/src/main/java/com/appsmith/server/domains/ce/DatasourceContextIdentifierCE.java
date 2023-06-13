/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.DatasourceContextIdentifier;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import static org.springframework.util.StringUtils.hasLength;

/**
 * This class is for generating keys for dsContext.
 * The object of this class will be used as keys for dsContext
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceContextIdentifierCE {

    protected String datasourceId;
    protected String environmentId;

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }

        if (!(obj instanceof DatasourceContextIdentifier keyObj)) {
            return false;
        }

        // if datasourceId is null for either of the objects then the keys can't be equal
        return hasLength(this.getDatasourceId())
                && this.getDatasourceId().equals(keyObj.getDatasourceId())
                && isEnvironmentIdEqual(keyObj.getEnvironmentId());
    }

    protected boolean isEnvironmentIdEqual(String otherEnvironmentId) {
        return true;
    }

    @Override
    public int hashCode() {
        int result = 0;
        result = hasLength(this.getDatasourceId()) ? this.getDatasourceId().hashCode() : result;
        result = hasLength(this.getDatasourceId())
                ? result * 31 + this.getDatasourceId().hashCode()
                : result;
        return result;
    }

    public boolean isKeyValid() {
        return hasLength(this.getDatasourceId());
    }
}
