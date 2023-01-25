package com.appsmith.server.dtos;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationTemplate extends BaseDomain {
    @JsonView(Views.Api.class)
    private String title;

    @JsonView(Views.Api.class)
    private String description;

    @JsonView(Views.Api.class)
    private String appUrl;
    
    @JsonView(Views.Api.class)
    private String appDataUrl;

    @JsonView(Views.Api.class)
    private String gifUrl;

    @JsonView(Views.Api.class)
    private String productImageUrl;

    @JsonView(Views.Api.class)
    private String sortPriority;

    @JsonView(Views.Api.class)
    private List<String> screenshotUrls;

    @JsonView(Views.Api.class)
    private List<String> widgets;

    @JsonView(Views.Api.class)
    private List<String> functions;

    @JsonView(Views.Api.class)
    private List<String> useCases;

    @JsonView(Views.Api.class)
    private List<String> datasources;

    @JsonView(Views.Api.class)
    private List<PageNameIdDTO> pages;

    @JsonView(Views.Api.class)
    private String minVersion;

    @JsonView(Views.Api.class)
    private String minVersionPadded;

    @JsonView(Views.Api.class)
    private Long downloadCount;

    @JsonView(Views.Api.class)
    private Object appData;

    @JsonView(Views.Api.class)
    private Boolean active;
}
