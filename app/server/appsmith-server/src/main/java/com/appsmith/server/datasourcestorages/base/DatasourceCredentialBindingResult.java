package com.appsmith.server.datasourcestorages.base;

import com.appsmith.external.models.DatasourceStorage;

import java.util.Set;

public record DatasourceCredentialBindingResult(
        DatasourceStorage datasourceStorage,
        boolean connectionConfigurationChanged,
        CredentialSource credentialSource,
        Set<String> changedConnectionSettingGroups) {

    public DatasourceCredentialBindingResult {
        changedConnectionSettingGroups = Set.copyOf(changedConnectionSettingGroups);
    }

    public enum CredentialSource {
        STORED("stored"),
        REQUEST("request"),
        CLEARED("cleared");

        private final String analyticsValue;

        CredentialSource(String analyticsValue) {
            this.analyticsValue = analyticsValue;
        }

        public String getAnalyticsValue() {
            return analyticsValue;
        }
    }
}
