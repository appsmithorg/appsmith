package com.appsmith.server.domains;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

public class DatasourceContextIdentifierTest {

    @Test
    public void verifyDsMapKeyEquality() {
        String dsId = UUID.randomUUID().toString();
        String defaultEnvironmentId = UUID.randomUUID().toString();
        DatasourceContextIdentifier keyObj = new DatasourceContextIdentifier(dsId, defaultEnvironmentId);
        DatasourceContextIdentifier keyObj1 = new DatasourceContextIdentifier(dsId, defaultEnvironmentId);
        assertEquals(keyObj, keyObj1);
    }

    @Test
    public void verifyDsMapKeyNotEqual() {
        String dsId = UUID.randomUUID().toString();
        String dsId1 = UUID.randomUUID().toString();

        // with different datasourceId and null environment id
        DatasourceContextIdentifier keyObj = new DatasourceContextIdentifier(dsId, null);
        DatasourceContextIdentifier keyObj1 = new DatasourceContextIdentifier(dsId1, null);
        assertNotEquals(keyObj, keyObj1);

        // with same datasource but null environment id
        DatasourceContextIdentifier keyObj2 = new DatasourceContextIdentifier(dsId, null);
        assertNotEquals(keyObj, keyObj2);

        // with same datasource but different environment id
        String differentEnvironmentId = UUID.randomUUID().toString();
        DatasourceContextIdentifier keyObj3 = new DatasourceContextIdentifier(dsId, differentEnvironmentId);
        assertNotEquals(keyObj, keyObj3);
    }

    @Test
    public void verifyDsMapKeyNotEqualWhenBothDatasourceIdNull() {
        String defaultEnvironmentId = UUID.randomUUID().toString();
        DatasourceContextIdentifier keyObj = new DatasourceContextIdentifier(null, defaultEnvironmentId);
        DatasourceContextIdentifier keyObj1 = new DatasourceContextIdentifier(null, defaultEnvironmentId);
        assertNotEquals(keyObj, keyObj1);
    }

    @Test
    public void verifyDatasourceContextIdentifierHashCode() {
        String sampleDatasourceId = UUID.randomUUID().toString();
        String defaultEnvironmentId = UUID.randomUUID().toString();
        DatasourceContextIdentifier datasourceContextIdentifier =
                new DatasourceContextIdentifier(sampleDatasourceId, defaultEnvironmentId);

        int hashCode = sampleDatasourceId.hashCode() * 31 + defaultEnvironmentId.hashCode();
        assertThat(datasourceContextIdentifier.hashCode()).isEqualTo(hashCode);
    }
}
