package com.appsmith.server.domains;


import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import lombok.Getter;
import lombok.Setter;
import org.springframework.util.StringUtils;


/**
 * This class is for generating keys for dscontext.
 * The object of this class will be used as keys for dscontext
 */
@Getter
@Setter
public class DsContextMapKey<T extends BaseDomain> {
    Datasource datasource;

    T baseDomainObject;

    public DsContextMapKey(Datasource datasource, T baseDomainObject) {
        this.datasource = datasource;
        this.baseDomainObject = baseDomainObject;
    }


    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if (!(obj instanceof DsContextMapKey<?>) || obj == null) {
            return false;
        }
        DsContextMapKey<T> keyObj = (DsContextMapKey<T>) obj;
        boolean datasourceBoolean = compareIds(this.getDatasource(), keyObj.getDatasource());
        boolean baseDomainObjectBoolean = compareIds(this.getBaseDomainObject(), keyObj.getBaseDomainObject());
        return datasourceBoolean && baseDomainObjectBoolean;
    }

    @Override
    public int hashCode() {
        int result = 0;
        if (this.datasource != null && this.datasource.getId() != null) {
            result = this.datasource.getId().hashCode();
        }

        if (this.baseDomainObject != null && this.baseDomainObject.getId() != null) {
            result = result*31 + this.baseDomainObject.getId().hashCode();
        }
        return result;
    }

    public boolean compareIds(BaseDomain obj, BaseDomain obj1) {
        if (obj == null && obj1 == null) {
            return true;
        } else if (obj == null || obj1 == null) {
            return false;
        } else if(obj.getId() == null && obj1.getId() == null) {
            return true;
        } else if (obj.getId() == null || obj1.getId() == null) {
            return false;
        } else if (obj.getId().equals(obj1.getId())) {
            return true;
        }
        return false;
    }

    public boolean isEmpty() {
        // this will be overridden in EE to have baseDomainObject
        if (this.datasource == null || !StringUtils.hasLength(this.datasource.getId())) {
            return true;
        }
        return false;
    }

}
