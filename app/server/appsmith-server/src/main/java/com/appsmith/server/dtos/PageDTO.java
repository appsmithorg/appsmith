package com.appsmith.server.dtos;

import com.appsmith.external.models.Policy;
import com.appsmith.external.views.Views;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.Layout;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class PageDTO {

    @Transient
    @JsonView(Views.Public.class)
    private String id;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String icon;

    @JsonView(Views.Public.class)
    String description;

    @JsonView(Views.Public.class)
    String slug;

    @JsonView(Views.Public.class)
    String customSlug;

    @Transient
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    List<Layout> layouts;

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    @Transient
    @JsonView(Views.Internal.class)
    protected Set<Policy> policies = new HashSet<>();

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant deletedAt = null;

    @JsonView(Views.Public.class)
    Boolean isHidden;

    @Transient
    @JsonView(Views.Public.class)
    Long lastUpdatedTime;

    // This field will be used to store the default/root pageId and applicationId for actions generated for git
    // connected applications and will be used to connect actions across the branches
    @Transient
    @JsonView(Views.Public.class)
    DefaultResources defaultResources;

    public void sanitiseToExportDBObject() {
        this.getLayouts().forEach(Layout::sanitiseToExportDBObject);
    }
}
