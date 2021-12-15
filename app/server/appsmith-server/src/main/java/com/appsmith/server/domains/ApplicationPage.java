package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.annotate.JsonIgnore;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ApplicationPage {

    String id;

    Boolean isDefault;

    // This field will represent the root pageId in git system where we are connecting resources among the branches
    @JsonIgnore
    String defaultPageId;

    @JsonIgnore
    public boolean isDefault() {
        return Boolean.TRUE.equals(isDefault);
    }

}
