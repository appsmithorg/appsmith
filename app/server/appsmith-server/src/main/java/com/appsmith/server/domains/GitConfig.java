package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Where;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
public class GitConfig implements AppsmithDomain {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    String authorName;

    String authorEmail;
}
