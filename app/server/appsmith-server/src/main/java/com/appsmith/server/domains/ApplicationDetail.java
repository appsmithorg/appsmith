package com.appsmith.server.domains;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class ApplicationDetail {
    Application.AppPositioning appPositioning;
    Application.NavigationSetting navigationSetting;

    public ApplicationDetail() {
        this.appPositioning = null;
        this.navigationSetting = null;
    }

}
