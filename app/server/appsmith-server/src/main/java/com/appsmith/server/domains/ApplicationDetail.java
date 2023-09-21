package com.appsmith.server.domains;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class ApplicationDetail {

    // appPositing field is renamed to layoutSystem
    @Deprecated
    Application.AppPositioning appPositioning;

    Application.LayoutSystem layoutSystem;
    Application.NavigationSetting navigationSetting;

    public ApplicationDetail() {
        this.layoutSystem = null;
        this.navigationSetting = null;
    }
}
