package com.external.utils;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.external.utils.DatasourceUtils.S3ConnectionSettings;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DatasourceUtilsTest {

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
        "10.0.0.255, true",
        "255.255.255.255, true",
        "0.0.0.0, true",
        "10.0.0.256, false",
        "256.0.0.1, false",
        "10.0.0, false",
        "10.0.0.5.1, false",
        "[::1], true",
        "minio.example.com, false"
    })
    void should_recognizeIpAddressOnlyWithOctetsUpTo255_when_hostIsChecked(String host, boolean expected) {
        // Given
        // the host

        // When
        boolean ipAddress = DatasourceUtils.isIpAddress(host);

        // Then
        assertThat(ipAddress).isEqualTo(expected);
    }

    /**
     * The service endpoint keeps the endpoint's scheme, host and port, and its path only when the bucket goes in the
     * path, without trailing slashes. Query, fragment and user info are dropped.
     */
    @ParameterizedTest(name = "{0} {1}")
    @CsvSource({
        "minio, https://minio.example.com:9000/base/path/, https://minio.example.com:9000/base/path, true",
        "minio, https://minio.example.com/base/path, https://minio.example.com/base/path, true",
        "minio, https://minio.example.com/, https://minio.example.com, true",
        "minio, http://10.0.0.5:9000/base/path//, http://10.0.0.5:9000/base/path, true",
        "minio, http://[::1]:9000/base/, http://[::1]:9000/base, true",
        "minio, https://endpoint-user:endpoint-pass@minio.example.com:9000/base/?x=1#frag,"
                + " https://minio.example.com:9000/base, true",
        "minio, minio.example.com:9000/base%20path/, https://minio.example.com:9000/base%20path, true",
        "other, http://10.0.0.5:9000/base/path/, http://10.0.0.5:9000/base/path, true",
        "other, https://objects.example.com/base/path, https://objects.example.com, false",
        "other, https://endpoint-user:endpoint-pass@objects.example.com:8443/base/?x=1#frag,"
                + " https://objects.example.com:8443, false",
        "google-cloud-storage, https://storage.googleapis.com/base/path/, https://storage.googleapis.com, false"
    })
    void should_keepSchemeHostPortAndPathStylePrefixOnly_when_endpointHasPathQueryFragmentOrUserInfo(
            String provider, String endpoint, String expectedEndpoint, boolean expectedPathStyle) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration(provider, endpoint);

        // When
        S3ConnectionSettings settings = DatasourceUtils.getS3ConnectionSettings(configuration);

        // Then
        assertThat(settings.endpoint()).hasToString(expectedEndpoint);
        assertThat(settings.pathStyleAccess()).isEqualTo(expectedPathStyle);
    }

    private static DatasourceConfiguration datasourceConfiguration(String provider, String endpoint) {
        DBAuth authentication = new DBAuth();
        authentication.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authentication.setUsername("AKIAIOSFODNN7EXAMPLE");
        authentication.setPassword("test-secret-key");

        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setAuthentication(authentication);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null); // index 0 is not used.
        properties.add(new Property("s3Provider", provider));
        properties.add(new Property("customRegion", ""));
        properties.add(new Property("default bucket", "my-bucket"));
        configuration.setProperties(properties);
        configuration.setEndpoints(List.of(new Endpoint(endpoint, null)));
        return configuration;
    }
}
