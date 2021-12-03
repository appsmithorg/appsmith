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

    String slug;

    @Transient
    String applicationId;

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
