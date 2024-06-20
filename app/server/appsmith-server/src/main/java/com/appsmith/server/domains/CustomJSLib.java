package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.CustomJSLibCE;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class CustomJSLib extends CustomJSLibCE {

    public CustomJSLib(String name, Set<String> accessor, String url, String docsUrl, String version, String defs) {
        super(name, accessor, url, docsUrl, version, defs);
    }

    public static class Fields extends CustomJSLibCE.Fields {}
}
