package com.appsmith.server.dtos;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Layout;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String id;

    String name;

    // This will be defaultApplicationId if this application is connected with git
    @Transient
    String applicationId;

    // This field will be used to store the page for specific branch in git
    @Transient
    String branchName;

    // This field will be used to store the default/root PageId for pages generated for git connected applications
    @Transient
    String defaultPageId;

    List<Layout> layouts;

    @Transient
    public Set<String> userPermissions = new HashSet<>();

    @Transient
    @JsonIgnore
    protected Set<Policy> policies = new HashSet<>();

    Instant deletedAt = null;

    Boolean isHidden;

    @Transient
    Long lastUpdatedTime;

}
