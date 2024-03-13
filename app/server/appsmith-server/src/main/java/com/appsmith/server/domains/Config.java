package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Document
@FieldNameConstants
public class Config extends BaseDomain {
    JSONObject config;

    String name;
}
