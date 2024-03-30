package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import net.minidev.json.JSONObject;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
@FieldNameConstants
public class Config extends BaseDomain {
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    private JSONObject config;

    @Column(unique = true)
    String name;

    public static Config fromMap(String name, Map<String, ?> config) {
        return new Config(new JSONObject(config), name);
    }
}
