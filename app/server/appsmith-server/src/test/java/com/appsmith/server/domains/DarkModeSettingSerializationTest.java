package com.appsmith.server.domains;

import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves that an incoming PUT body carrying applicationDetail.darkModeSetting is
 * deserialized into the domain (and serialized back) using the app's real
 * ObjectMapper config — i.e. the field round-trips like navigationSetting/themeSetting.
 */
public class DarkModeSettingSerializationTest {

    @Test
    void darkModeSetting_roundTrips_throughDefaultObjectMapper() throws Exception {
        ObjectMapper om = SerializationUtils.getDefaultObjectMapper(null);

        String requestBody = "{\"applicationDetail\":{\"darkModeSetting\":"
                + "{\"defaultMode\":\"DARK\",\"allowEndUserSwitch\":true,\"customCss\":\"--x: 1;\"}}}";

        Application app = om.readValue(requestBody, Application.class);

        assertThat(app.getApplicationDetail()).isNotNull();
        assertThat(app.getApplicationDetail().getDarkModeSetting()).isNotNull();
        assertThat(app.getApplicationDetail().getDarkModeSetting().getDefaultMode())
                .isEqualTo("DARK");
        assertThat(app.getApplicationDetail().getDarkModeSetting().getAllowEndUserSwitch())
                .isTrue();

        // And it serializes back out (so the response/persisted object keeps it).
        String out = om.writeValueAsString(app.getApplicationDetail());
        assertThat(out).contains("darkModeSetting").contains("DARK");
    }
}
