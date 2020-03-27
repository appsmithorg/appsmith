package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;


@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Organization extends BaseDomain {

    private String domain;

    @NotNull
    private String name;

    private String website;

    private List<OrganizationSetting> organizationSettings;

    private List<OrganizationPlugin> plugins;

    @NotNull
    @Indexed(unique = true)
    private String slug;

    public String getSlug() {
        return slug == null ? toSlug(name) : slug;
    }

    public static String toSlug(String text) {
        return text == null ? null : text.replaceAll("[^\\w\\d]+", "-").toLowerCase();
    }

}
