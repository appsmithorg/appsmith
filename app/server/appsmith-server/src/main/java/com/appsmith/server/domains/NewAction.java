package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.NewActionCE;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Where;

@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
@FieldNameConstants
public class NewAction extends NewActionCE {
    public static class Fields extends NewActionCE.Fields {}
}
