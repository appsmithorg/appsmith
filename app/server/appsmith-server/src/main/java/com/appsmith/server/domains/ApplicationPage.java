package com.appsmith.server.domains;

import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Transient;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.util.StringUtils;

@Getter
@Setter
@ToString
@NoArgsConstructor
@EqualsAndHashCode
public class ApplicationPage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JsonView({Views.Public.class, Views.Export.class, Git.class})
    String id;

    @JsonView({Views.Public.class, Git.class})
    Boolean isDefault;

    @Transient
    @JsonView(Views.Public.class)
    String slug;

    @Transient
    @JsonView(Views.Public.class)
    String customSlug;

    // This field will represent the root pageId in git system where we are connecting resources among the branches
    @JsonView(Views.Internal.class)
    String defaultPageId;

    @JsonIgnore
    public boolean isDefault() {
        return Boolean.TRUE.equals(isDefault);
    }

    @JsonView({Views.Internal.class, Views.Public.class})
    @Transient
    public String getBaseId() {
        return StringUtils.hasLength(defaultPageId) ? defaultPageId : id;
    }
}
