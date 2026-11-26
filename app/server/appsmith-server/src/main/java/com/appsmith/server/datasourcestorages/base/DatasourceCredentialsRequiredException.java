package com.appsmith.server.datasourcestorages.base;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;

import java.util.Set;

public class DatasourceCredentialsRequiredException extends AppsmithException {

    private final Set<String> changedConnectionSettingGroups;

    public DatasourceCredentialsRequiredException(Set<String> changedConnectionSettingGroups) {
        super(AppsmithError.DATASOURCE_CREDENTIALS_REQUIRED);
        this.changedConnectionSettingGroups = Set.copyOf(changedConnectionSettingGroups);
    }

    public Set<String> getChangedConnectionSettingGroups() {
        return changedConnectionSettingGroups;
    }
}
