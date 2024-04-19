package com.appsmith.server.dtos;

import com.appsmith.external.models.BaseDomain;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationTemplate extends BaseDomain {
    private String title;
    private String description;
    private String appUrl;
    private String appDataUrl;
    private String gifUrl;
    private String productImageUrl;
    private String sortPriority;
    private List<String> screenshotUrls;
    private List<String> widgets;
    private List<String> functions;
    private List<String> useCases;
    private List<String> datasources;
    private List<PageNameIdDTO> pages;
    private String minVersion;
    private String minVersionPadded;
    private Long downloadCount;
    private Object appData;
    private Boolean active;
    //    These fields will be used to display template metadata
    private String mdText;
    private String excerpt;
    private String category;
    private Boolean featured;
    private List<String> tags;
    private Boolean allowPageImport;
    // This flag denotes whether a template is an official template
    // or a community template
    private Boolean isCommunityTemplate;
    // This will point to the email of the template's author. This cannot be
    // null if the template is a community template
    @Email
    private String authorEmail;

    private int templateGridRowSize;

    private int templateGridColumnSize;
}
