package com.appsmith.server.dtos;

import com.appsmith.external.constants.ErrorReferenceDocUrl;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GitDocsDTO {
    ErrorReferenceDocUrl docKey;

    String docUrl;
}
