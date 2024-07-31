package com.appsmith.server.domains.ce;

import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Application;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class ApplicationDetailCE {
    @JsonView({Views.Public.class, Git.class})
    Application.AppPositioning appPositioning;

    @JsonView({Views.Public.class, Git.class})
    Application.NavigationSetting navigationSetting;

    @JsonView({Views.Public.class, Git.class})
    Application.ThemeSetting themeSetting;

    public ApplicationDetailCE() {
        this.appPositioning = null;
        this.navigationSetting = null;
        this.themeSetting = new Application.ThemeSetting();
    }
}
