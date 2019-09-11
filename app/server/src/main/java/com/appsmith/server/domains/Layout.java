package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.JSONObject;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class Layout extends BaseDomain {

    ScreenType screen;

    JSONObject dsl;
}
