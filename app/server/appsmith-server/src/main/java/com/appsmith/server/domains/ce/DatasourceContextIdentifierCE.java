package com.appsmith.server.domains.ce;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import static org.springframework.util.StringUtils.hasLength;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

/**
 * This class is for generating keys for dsContext.
 * The object of this class will be used as keys for dsContext
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceContextIdentifierCE {

    @JsonView(Views.Api.class)
    protected String datasourceId;

    @JsonView(Views.Api.class)

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
        boolean areBothEnvironmentIdSameOrNull = hasLength(this.getEnvironmentId()) ?
                this.getEnvironmentId().equals(keyObj.getEnvironmentId()) : !hasLength(keyObj.getEnvironmentId());

        // if datasourceId is null for either of the objects then the keys can't be equal
        return hasLength(this.getDatasourceId())
                && this.getDatasourceId().equals(keyObj.getDatasourceId()) &&
                areBothEnvironmentIdSameOrNull;
    }

    @Override
    public int hashCode() {
        int result = 0;
        result = hasLength(this.getDatasourceId()) ? this.getDatasourceId().hashCode() : result;
        result = hasLength(this.getDatasourceId()) ? result*31 + this.getDatasourceId().hashCode() : result;
        return result;
    }

    public boolean isKeyValid() {
        return hasLength(this.getDatasourceId());
    }


}
