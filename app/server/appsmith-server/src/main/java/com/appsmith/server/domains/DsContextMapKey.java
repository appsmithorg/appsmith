package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;

/**
 * This class is for generating keys for dsContext.
 * The object of this class will be used as keys for dsContext
 */
@Getter
@Setter
public class DsContextMapKey {

    String datasourceId;

    String environmentId;

    public DsContextMapKey(String datasourceId, String environmentId) {
        this.datasourceId = datasourceId;
        this.environmentId = environmentId;
    }

    public DsContextMapKey() {
        // empty constructor
    }


    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }

        if (!(obj instanceof DsContextMapKey)) {
            return false;
        }
        DsContextMapKey keyObj = (DsContextMapKey)  obj;
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
        // this will be overridden in EE
       return !StringUtils.hasLength(this.datasourceId);
    }

}
