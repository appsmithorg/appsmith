package com.appsmith.external.models;

import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class Category extends BaseDomain {

    @Indexed(unique = true)
    String name; // Category name here
}
