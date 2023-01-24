package com.appsmith.server.models.export;

import java.util.List;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class ApplicationResource {

    private int fileFormatVersion;
    private int clientSchemaVersion;
    private int serverSchemaVersion;

    @JsonView(Views.Internal.class)
    private DatasourceMetadata datasource;

    @JsonView(Views.Internal.class)
    private ApplicationMetadata application;

    @JsonView(Views.Internal.class)
    private ThemeMetadata theme;

    @JsonView(Views.Internal.class)
    private List<PageMetadata> pages;
}
