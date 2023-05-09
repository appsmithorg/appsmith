package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.http.MediaType;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Document
public class Asset extends BaseDomain {

    public Asset(MediaType mediaType, byte[] data) {
        this(mediaType == null ? null : mediaType.toString(), data, null);
    }

    public Asset(MediaType mediaType, byte[] data, String name) {
        this(mediaType == null ? null : mediaType.toString(), data, name);
    }

    String contentType;

    byte[] data;

    String name;

}
