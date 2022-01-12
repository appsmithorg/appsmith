package com.appsmith.server.converters;


import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import lombok.Data;
import org.junit.Before;
import org.junit.Test;

import java.lang.reflect.Type;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

public class GsonISOStringToInstantConverterTest {
    private Gson gson;

    @Before
    public void setUp() {
        gson = new GsonBuilder()
                .registerTypeAdapter(Instant.class, new GsonISOStringToInstantConverter())
                .create();
    }

    @Test
    public void parse_WhenEmptyString_ParsesNull() {
        String data = "{\"instant\": \"\"}";
        Type fileType = new TypeToken<SameDateDTO>() {
        }.getType();
        SameDateDTO sameDateDTO = gson.fromJson(data, fileType);
        assertThat(sameDateDTO.getInstant()).isNull();
    }

    @Test
    public void parse_WhenNull_ParsesNull() {
        String data = "{\"instant\": null}";
        Type fileType = new TypeToken<SameDateDTO>() {
        }.getType();
        SameDateDTO sameDateDTO = gson.fromJson(data, fileType);
        assertThat(sameDateDTO.getInstant()).isNull();
    }

    @Test
    public void parse_WhenValidIsoDate_ParsesDate() {
        String data = "{\"instant\": \"2021-12-30T08:58:31Z\"}";
        Type fileType = new TypeToken<SameDateDTO>() {
        }.getType();
        SameDateDTO sameDateDTO = gson.fromJson(data, fileType);
        assertThat(sameDateDTO.getInstant()).isNotNull();
        assertThat(sameDateDTO.getInstant().toString()).isEqualTo("2021-12-30T08:58:31Z");
    }

    @Test
    public void parse_DateInDoublePrecisionTimestampFormat_ParsesDate() {
        String data = "{\"instant\": 1640854711.292000000}";
        Type fileType = new TypeToken<SameDateDTO>() {
        }.getType();
        SameDateDTO sameDateDTO = gson.fromJson(data, fileType);
        assertThat(sameDateDTO.getInstant()).isNotNull();
        assertThat(sameDateDTO.getInstant().toString()).isEqualTo("2021-12-30T08:58:31Z");
    }

    @Data
    public static class SameDateDTO {
        private Instant instant;
    }
}