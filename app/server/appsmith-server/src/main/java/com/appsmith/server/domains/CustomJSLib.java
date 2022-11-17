package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class CustomJSLib extends BaseDomain {
    String name;
    String accessor;
    String url;
    String docsUrl;
    String version;
    Map<String, Object> defs;

    // TODO: add comments
    @Override
    public boolean equals(Object o) {
        if (! (o instanceof CustomJSLib)) {
            return false;
        }

        return ((CustomJSLib) o).getName().equals(this.name) && ((CustomJSLib) o).getVersion().equals(this.version);
    }
}
