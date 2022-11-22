package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
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
public class CustomJSLib extends BaseDomain {
    /* Library name */
    String name;

    /* These are the namespaces under which the library functions reside. User would access lib methods like
    `accessor.method` */
    Set<String> accessor;

    /* Library UMD src url */
    String url;

    /* Library documentation page URL */
    String docsUrl;

    /* Library version */
    String version;

    /* `Tern` tool definitions - it defines the methods exposed by the library. It helps us with auto-complete
    feature i.e. the function name showing up as suggestion when user has partially typed it. */
    String defs;

    /**
     * The equality operator has been overridden here so that when two custom JS library objects are compared, they
     * are compared based on their name and version as opposed to Java object reference. At the moment this check
     * helps us to identify which JS library needs to be removed from the list of installed libraries when a user
     * chooses to uninstall a library. It also helps us to identify if a library has already been added.
     * Please note that this comment may have to be updated once the following issue is closed:
     * https://github.com/appsmithorg/appsmith/issues/18226
     */
    @Override
    public boolean equals(Object o) {
        if (! (o instanceof CustomJSLib)) {
            return false;
        }

        /**
         * We check the equality using the accessor set since this is supposed to be unique for a given library. The
         * accessors in the accessor set are defined by the installed library i.e. client or the server does not have
         * any logic defined to generate accessor values.
         */
        return ((CustomJSLib) o).getAccessor().equals(this.accessor);
    }
}
