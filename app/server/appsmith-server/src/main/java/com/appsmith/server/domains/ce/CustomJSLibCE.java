package com.appsmith.server.domains.ce;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.RefAwareDomain;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.helpers.CollectionUtils;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.Type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@MappedSuperclass
@FieldNameConstants
public class CustomJSLibCE extends BaseDomain {
    /* Library name */
    @JsonView({Views.Public.class, Git.class})
    String name;

    /**
     * This string is used to uniquely identify a given library. We expect this to be universally unique for a given
     * JS library
     */
    @JsonView({Views.Public.class, Git.class})
    @Column(columnDefinition = "text")
    String uidString;

    /**
     * These are the namespaces under which the library functions reside. User would access lib methods like
     * `accessor.method`
     */
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView({Views.Public.class, Git.class})
    Set<String> accessor;

    /* Library UMD src url */
    @Column(columnDefinition = "text")
    @JsonView({Views.Public.class, Git.class})
    String url;

    /* Library documentation page URL */
    @JsonView({Views.Public.class, Git.class})
    String docsUrl;

    /* Library version */
    @JsonView({Views.Public.class, Git.class})
    String version;

    /* `Tern` tool definitions - it defines the methods exposed by the library. It helps us with auto-complete
    feature i.e. the function name showing up as suggestion when user has partially typed it. */
    @JsonView({Views.Public.class, Git.class})
    @ColumnTransformer(
            // This is a `bytea` type column in Postgres, because there's a not-so-rare chance that this value can
            // contain
            // the NUL character. But Postgres doesn't allow `text` columns to contain the NUL character, so we have to
            // use
            // a `bytea` column type. But since everything else (client, git, rest of the backend code, MongoDB version)
            // needs this field to be a `String`, we keep it to `String`, but apply read/write converters when
            // interacting
            // with the database.
            // We also assume UTF8 here, since this value is known to always be valid JSON, which is UTF8-only.
            read = "convert_from(defs, 'utf8')",
            write = "convert_to(?, 'utf8')")
    String defs;

    public CustomJSLibCE(String name, Set<String> accessor, String url, String docsUrl, String version, String defs) {
        setName(name);
        setAccessor(accessor);
        setUrl(url);
        setDocsUrl(docsUrl);
        setDefs(defs);
        setVersion(version);
    }

    public void setAccessor(Set<String> value) {
        accessor = value;
        recomputeUid();
    }

    public void setUrl(String value) {
        url = value;
        recomputeUid();
    }

    private void recomputeUid() {
        final List<String> items = new ArrayList<>();

        // Add all accessor items, sorted.
        if (!CollectionUtils.isNullOrEmpty(accessor)) {
            items.addAll(accessor);
            Collections.sort(items);
        }

        // Add URL to the end of sorted accessors list.
        items.add(url);

        setUidString(String.join("_", items));
    }

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
        if (!(o instanceof CustomJSLibCE)) {
            return false;
        }

        /**
         * We check the equality using the uidString since this is supposed to be unique for a given library.
         */
        return ((CustomJSLibCE) o).getUidString().equals(this.uidString);
    }

    @Override
    public int hashCode() {
        return this.uidString.hashCode();
    }

    @Override
    public void sanitiseToExportDBObject() {
        this.setId(null);
        this.setCreatedAt(null);
        this.setUpdatedAt(null);
    }

    public static class Fields extends RefAwareDomain.Fields {}
}
