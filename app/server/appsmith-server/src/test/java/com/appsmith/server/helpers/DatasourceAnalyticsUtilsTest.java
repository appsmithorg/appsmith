package com.appsmith.server.helpers;

import com.appsmith.external.models.DatasourceStorage;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static com.appsmith.server.constants.ce.AnalyticsConstantsCE.DATASOURCE_CREATED_AT_SHORTNAME;
import static com.appsmith.server.constants.ce.AnalyticsConstantsCE.DATASOURCE_ID_SHORTNAME;
import static com.appsmith.server.constants.ce.AnalyticsConstantsCE.DATASOURCE_IS_MOCK_SHORTNAME;
import static com.appsmith.server.constants.ce.AnalyticsConstantsCE.DATASOURCE_IS_TEMPLATE_SHORTNAME;
import static com.appsmith.server.constants.ce.AnalyticsConstantsCE.DATASOURCE_NAME_SHORTNAME;
import static com.appsmith.server.constants.ce.AnalyticsConstantsCE.ENVIRONMENT_ID_SHORTNAME;
import static com.appsmith.server.constants.ce.AnalyticsConstantsCE.ENVIRONMENT_NAME_SHORTNAME;
import static org.assertj.core.api.Assertions.assertThat;

public class DatasourceAnalyticsUtilsTest {

    @Test
    public void testGetAnalyticsPropertiesWithStorageOnActionExecution() {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        String datasourceId = "randomDatasourceId";
        String datasourceName = "randomDatasourceName";
        String environmentId = "randomEnvironmentId";
        String environmentName = "randomEnvironmentName";
        String dateCreated = "1970-1-1";
        String defaultString = "";
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentId);
        datasourceStorage.setName(datasourceName);

        Map<String, Object> data = DatasourceAnalyticsUtils.getAnalyticsPropertiesWithStorageOnActionExecution(
                datasourceStorage, dateCreated, environmentName);
        assertThat(data.get(DATASOURCE_CREATED_AT_SHORTNAME)).isEqualTo(dateCreated);
        assertThat(data.get(DATASOURCE_ID_SHORTNAME)).isEqualTo(datasourceId);
        assertThat(data.get(DATASOURCE_NAME_SHORTNAME)).isEqualTo(datasourceName);
        assertThat(data.get(ENVIRONMENT_ID_SHORTNAME)).isEqualTo(environmentId);
        assertThat(data.get(ENVIRONMENT_NAME_SHORTNAME)).isEqualTo(environmentName);
        assertThat(data.get(DATASOURCE_IS_TEMPLATE_SHORTNAME)).isEqualTo(defaultString);
        assertThat(data.get(DATASOURCE_IS_MOCK_SHORTNAME)).isEqualTo(defaultString);
    }
}
