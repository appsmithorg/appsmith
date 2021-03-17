package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import reactor.core.publisher.Mono;

import java.util.Base64;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class UploadedFile {

    String name;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String base64Content;

    @JsonIgnore
    public Mono<String> getDecodedContent() {
        return Mono.just(new String(Base64.getDecoder().decode(base64Content)));
    }

}
