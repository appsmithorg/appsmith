package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.CustomJSLibCE;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class CustomJSLib extends CustomJSLibCE {

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public CustomJSLib(
            @JsonProperty("name") String name,
            @JsonProperty("accessor") Set<String> accessor,
            @JsonProperty("url") String url,
            @JsonProperty("docsUrl") String docsUrl,
            @JsonProperty("version") String version,
            @JsonProperty("defs") String defs) {
        super(name, accessor, url, docsUrl, version, defs);
    }
}
