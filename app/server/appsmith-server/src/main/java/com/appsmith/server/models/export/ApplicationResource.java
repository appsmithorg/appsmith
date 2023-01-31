package com.appsmith.server.models.export;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class ApplicationResource {

    private int fileFormatVersion;
    private int clientSchemaVersion;
    private int serverSchemaVersion;

    @JsonIgnore
    private DatasourceMetadata datasource;

    @JsonIgnore
    private ApplicationMetadata application;

    @JsonIgnore
    private ThemeMetadata theme;

    @JsonIgnore
    private List<PageMetadata> pages;
}
