package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import static org.springframework.util.StringUtils.hasText;

/**
 * This class is for generating keys for dsContext.
 * The object of this class will be used as keys for dsContext
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceContextIdentifier {

    private String datasourceId;
    private String environmentId;

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }

        if (!(obj instanceof DatasourceContextIdentifier keyObj)) {
            return false;
        }

        // if datasourceId is null for either of the objects then the keys can't be equal
        return hasText(this.getDatasourceId())
                && this.getDatasourceId().equals(keyObj.getDatasourceId())
                && isEnvironmentIdEqual(keyObj.getEnvironmentId());
    }

    private boolean isEnvironmentIdEqual(String otherEnvironmentId) {
        return hasText(this.getEnvironmentId()) && this.getEnvironmentId().equals(otherEnvironmentId);
    }

    @Override
    public int hashCode() {
        int result = 0;
        result = hasText(this.getDatasourceId()) ? this.getDatasourceId().hashCode() : result;
        result = hasText(this.getEnvironmentId())
                ? result * 31 + this.getEnvironmentId().hashCode()
                : result;
        return result;
    }

    public boolean isKeyValid() {
        return hasText(this.getDatasourceId()) && hasText(this.getEnvironmentId());
    }
}
