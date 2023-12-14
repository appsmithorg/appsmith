package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AutoCommitConfig {
    private Boolean enabled;

    public Boolean getEnabled() {
        // if the enabled is not set, it should be treated as true
        return enabled == null || enabled;
    }
}
