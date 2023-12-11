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

    public ApplicationDetailCE() {
        this.appPositioning = null;
        this.navigationSetting = null;
    }
}
