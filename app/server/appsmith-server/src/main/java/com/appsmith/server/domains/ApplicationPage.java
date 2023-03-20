package com.appsmith.server.domains;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
@NoArgsConstructor
@EqualsAndHashCode
public class ApplicationPage {

    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
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

    @JsonView(Views.Internal.class)
    public boolean isDefault() {
        return Boolean.TRUE.equals(isDefault);
    }

}
