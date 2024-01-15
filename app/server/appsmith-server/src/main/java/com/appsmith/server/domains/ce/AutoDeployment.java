package com.appsmith.server.domains.ce;

import lombok.Data;

import java.time.Instant;
import java.util.Objects;

@Data
public class AutoDeployment {
    private Instant lastDeployedAt;
    private String branchName;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AutoDeployment that = (AutoDeployment) o;
        return branchName.equals(that.branchName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(branchName);
    }
}
