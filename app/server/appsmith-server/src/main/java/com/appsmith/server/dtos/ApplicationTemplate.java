package com.appsmith.server.dtos;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationTemplate extends BaseDomain {
    @JsonView(Views.Public.class)
    private String title;

    @JsonView(Views.Public.class)
    private String description;

    @JsonView(Views.Public.class)
    private String appUrl;
    
    @JsonView(Views.Public.class)
    private String appDataUrl;

    @JsonView(Views.Public.class)
    private String gifUrl;

    @JsonView(Views.Public.class)
    private String productImageUrl;

    @JsonView(Views.Public.class)
    private String sortPriority;

    @JsonView(Views.Public.class)
    private List<String> screenshotUrls;

    @JsonView(Views.Public.class)
    private List<String> widgets;

    @JsonView(Views.Public.class)
    private List<String> functions;

    @JsonView(Views.Public.class)
    private List<String> useCases;

    @JsonView(Views.Public.class)
    private List<String> datasources;

    @JsonView(Views.Public.class)
    private List<PageNameIdDTO> pages;

    @JsonView(Views.Public.class)
    private String minVersion;

    @JsonView(Views.Public.class)
    private String minVersionPadded;

    @JsonView(Views.Public.class)
    private Long downloadCount;

    @JsonView(Views.Public.class)
    private Object appData;

    @JsonView(Views.Public.class)
    private Boolean active;
}
