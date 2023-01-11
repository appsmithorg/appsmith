package com.appsmith.server.domains.ce;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.util.StringUtils;

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

        if (!(obj instanceof DatasourceContextIdentifierCE)) {
            return false;
        }

        DatasourceContextIdentifierCE keyObj = (DatasourceContextIdentifierCE)  obj;
        boolean areBothEnvironmentIdSameOrNull = this.hasLength(this.getEnvironmentId()) ?
                this.getEnvironmentId().equals(keyObj.getEnvironmentId()) : !this.hasLength(keyObj.getEnvironmentId());

        // if datasourceId is null for either of the objects then the keys can't be equal
        return this.hasLength(this.getDatasourceId())
                && this.getDatasourceId().equals(keyObj.getDatasourceId()) &&
                areBothEnvironmentIdSameOrNull;
    }

    @Override
    public int hashCode() {
        int result = 0;
        result = this.hasLength(this.getDatasourceId()) ? this.getDatasourceId().hashCode() : result;
        result = this.hasLength(this.getDatasourceId()) ? result*31 + this.getDatasourceId().hashCode() : result;
        return result;
    }

    public boolean isKeyNotValid() {
        return !this.hasLength(this.getDatasourceId());
    }

    public boolean hasLength(String id) {
        return StringUtils.hasLength(id);
    }

}
