package com.appsmith.server.dtos;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Layout;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
@FieldNameConstants
public class PageDTO {

    @Transient
    @JsonView({Views.Public.class})
    private String id;

    @Transient
    @JsonView({Views.Public.class})
    private String baseId;

    @JsonView({Views.Public.class, Views.Export.class, Git.class})
    String name;

    @JsonView({Views.Public.class})
    String icon;

    @JsonView(Views.Public.class)
    String description;

    @JsonView({Views.Public.class, Views.Export.class, Git.class})
    String slug;

    @JsonView({Views.Public.class, Git.class})
    String customSlug;

    @Transient
    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView({Views.Public.class, Views.Export.class, Git.class})
    List<Layout> layouts;

    @Transient
    @JsonView(Views.Public.class)
    public Set<String> userPermissions = new HashSet<>();

    @Transient
    @JsonView(Views.Internal.class)
    protected Map<String, Policy> policyMap = new HashMap<>();

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    @JsonView(Views.Public.class)
    Instant deletedAt = null;

    @JsonView({Views.Public.class, Git.class})
    Boolean isHidden;

    @Transient
    @JsonView(Views.Public.class)
    Long lastUpdatedTime;

    @Transient
    @JsonView({Views.Internal.class})
    RefType refType;

    @Transient
    @JsonView({Views.Internal.class})
    String refName;

    @JsonView(Views.Public.class)
    Map<String, List<String>> dependencyMap;

    /**
     * An unmodifiable set of policies.
     */
    @JsonView(Views.Internal.class)
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    public Set<Policy> getPolicies() {
        return policyMap == null ? null : Set.copyOf(policyMap.values());
    }

    @JsonView(Views.Internal.class)
    @Deprecated(forRemoval = true, since = "Use policyMap instead")
    public void setPolicies(Set<Policy> policies) {
        if (policies == null) {
            policyMap = null;
            return;
        }
        policyMap = new HashMap<>();
        for (Policy policy : policies) {
            policyMap.put(policy.getPermission(), policy);
        }
    }

    public void sanitiseToExportDBObject() {
        this.setDependencyMap(null);
        this.getLayouts().forEach(Layout::sanitiseToExportDBObject);
    }
}
