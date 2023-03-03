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
@NoArgsConstructor
@EqualsAndHashCode
public class ApplicationDetail {
    Application.AppPositioning appPositioning;
    Application.NavigationSetting navigationSetting;

}
