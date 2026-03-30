package com.appsmith.external.dtos;

import com.appsmith.external.git.constants.ce.RefType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GitRefDTO {

    String refName;

    RefType refType;

    /**
     * for tags, while tagging we require messages.
     */
    String message;

    @JsonProperty("default")
    boolean isDefault;

    boolean createdFromLocal;

    String sha;
}
