package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.MediaType;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Asset extends BaseDomain {

    public Asset(MediaType mediaType, byte[] data) {
        this(mediaType == null ? null : mediaType.toString(), data);
    }

    @JsonView(Views.Api.class)
    String contentType;

    @JsonView(Views.Api.class)
    byte[] data;

}
