package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.Url;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
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

    @NotNull(message = "Name is mandatory")
    private String name;

    private String website;

    private String email;

    private List<OrganizationSetting> organizationSettings;

    private List<OrganizationPlugin> plugins;

    private String slug;

    @JsonIgnore
    private List<UserRole> userRoles;

    @JsonIgnore
    private String logoAssetId;

    public String makeSlug() {
        return toSlug(name);
    }

    public static String toSlug(String text) {
        return text == null ? null : text.replaceAll("[^\\w\\d]+", "-").toLowerCase();
    }

    public String getLogoUrl() {
        return Url.ASSET_URL + "/" + logoAssetId;
    }

}
