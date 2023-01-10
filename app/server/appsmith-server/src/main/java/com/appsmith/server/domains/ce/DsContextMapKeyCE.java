package com.appsmith.server.domains.ce;

import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;

/**
 * This class is for generating keys for dsContext.
 * The object of this class will be used as keys for dsContext
 */
@Getter
@Setter
public class DsContextMapKeyCE {

    protected String datasourceId;

    protected String environmentId;

    public DsContextMapKeyCE(String datasourceId, String environmentId) {
        this.datasourceId = datasourceId;
        this.environmentId = environmentId;
    }

    public DsContextMapKeyCE() {
        // empty constructor
    }


    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }

        if (!(obj instanceof DsContextMapKeyCE)) {
            return false;
        }

        DsContextMapKeyCE keyObj = (DsContextMapKeyCE)  obj;
        boolean areBothEnvironmentIdSameOrNull = StringUtils.hasLength(environmentId) ?
                environmentId.equals(keyObj.environmentId) : !StringUtils.hasLength(keyObj.environmentId);

        // if datasourceId is null for either of the objects then the keys can't be equal
        return StringUtils.hasLength(datasourceId)
                && datasourceId.equals(keyObj.datasourceId) &&
                areBothEnvironmentIdSameOrNull;
    }

    @Override
    public int hashCode() {
        int result = 0;
        result = StringUtils.hasLength(this.datasourceId) ? this.datasourceId.hashCode() : result;
        result = StringUtils.hasLength(this.environmentId) ? result*31 + this.environmentId.hashCode() : result;
        return result;
    }

    public boolean isEmpty() {
        return !StringUtils.hasLength(this.datasourceId);
    }

}
