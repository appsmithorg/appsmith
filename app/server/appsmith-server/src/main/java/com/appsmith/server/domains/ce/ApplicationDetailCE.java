package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.Application;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class ApplicationDetailCE {
    Application.AppPositioning appPositioning;
    Application.NavigationSetting navigationSetting;
    Application.ThemeSetting themeSetting;

    public ApplicationDetailCE() {
        this.appPositioning = null;
        this.navigationSetting = null;
        this.themeSetting = null;
    }
}
