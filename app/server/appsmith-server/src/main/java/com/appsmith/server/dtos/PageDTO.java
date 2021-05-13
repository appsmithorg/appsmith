package com.appsmith.server.dtos;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Layout;
import com.appsmith.external.views.BaseView;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonView(BaseView.Summary.class)
    @Transient
    private String id;

    @JsonView(BaseView.Summary.class)
    String name;

    @JsonView(BaseView.Summary.class)
    @Transient
    String applicationId;

    @JsonView(BaseView.Summary.class)
    List<Layout> layouts;

    @JsonView(BaseView.Summary.class)
    @Transient
    public Set<String> userPermissions = new HashSet<>();

    @Transient
    @JsonIgnore
    protected Set<Policy> policies = new HashSet<>();

    @JsonView(BaseView.Summary.class)
    Instant deletedAt = null;

    @JsonView(BaseView.Summary.class)
    Boolean isHidden;

}
