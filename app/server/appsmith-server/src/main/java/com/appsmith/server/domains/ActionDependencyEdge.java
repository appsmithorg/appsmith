package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.apache.commons.lang.builder.EqualsBuilder;
import org.apache.commons.lang.builder.HashCodeBuilder;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class ActionDependencyEdge {
    String source;
    String target;

    @Override
    public int hashCode() {
        return new HashCodeBuilder()
                .append(source)
                .append(target)
                .toHashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof ActionDependencyEdge) {
            final ActionDependencyEdge actionDependencyEdge = (ActionDependencyEdge) obj;

            return new EqualsBuilder()
                    .append(source, actionDependencyEdge.source)
                    .append(target, actionDependencyEdge.target)
                    .isEquals();
        } else {
            return false;
        }
    }

    @Override
    public String toString() {
        return source + " : " + target;
    }
}
