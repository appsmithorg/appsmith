package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.CustomJSLibCE;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Where;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
public class CustomJSLib extends CustomJSLibCE {

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public CustomJSLib(
            @JsonProperty("name") String name,
            @JsonProperty("accessor") Set<String> accessor,
            @JsonProperty("url") String url,
            @JsonProperty("docsUrl") String docsUrl,
            @JsonProperty("version") String version,
            @JsonProperty("defs") byte[] defs) {
        super(name, accessor, url, docsUrl, version, defs);
    }

    public static class Fields extends CustomJSLibCE.Fields {}
}
