package com.appsmith.server.dtos;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationTemplate extends BaseDomain {
    private String title;
    private String description;
    private String appUrl;
    private String gifUrl;
    private List<String> screenshotUrls;
    private List<String> widgets;
    private List<String> functions;
    private List<String> useCases;
    private List<String> datasources;
    private String minVersion;
    private String minVersionPadded;
    private Long downloadCount;
    private Object appData;
    private Boolean active;
}
