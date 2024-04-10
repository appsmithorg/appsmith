package com.appsmith.external.models;

import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class AnalyticsInfo {
    @JsonView({Views.Public.class, FromRequest.class})
    private Map<String, Object> analyticsData;
}
