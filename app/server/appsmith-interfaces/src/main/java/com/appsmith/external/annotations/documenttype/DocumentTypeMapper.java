package com.appsmith.external.annotations.documenttype;

import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.data.convert.TypeInformationMapper;
import org.springframework.data.mapping.Alias;
import org.springframework.data.util.ClassTypeInformation;
import org.springframework.data.util.TypeInformation;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * This {@link TypeInformationMapper} implementation makes use of the {@link DocumentType} annotation to register all
 * such entities as possible candidates for domain mapping.
 */
public class DocumentTypeMapper implements TypeInformationMapper {

    private final Map<String, ClassTypeInformation<?>> aliasToTypeMap;
    private final Map<ClassTypeInformation<?>, String> typeToAliasMap;

    private DocumentTypeMapper(List<String> basePackagesToScan) {
        aliasToTypeMap = new HashMap<>();
        typeToAliasMap = new HashMap<>();

        // Upon initialization, read all aliases from annotated entities
        populateTypeMap(basePackagesToScan);
    }

    private void populateTypeMap(List<String> basePackagesToScan) {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);

        scanner.addIncludeFilter(new AnnotationTypeFilter(DocumentType.class));

        for (String basePackage : basePackagesToScan) {
            for (BeanDefinition bd : scanner.findCandidateComponents(basePackage)) {
                try {
                    Class<?> clazz = Class.forName(bd.getBeanClassName());
                    DocumentType documentTypeAnnotation = clazz.getAnnotation(DocumentType.class);

                    ClassTypeInformation<?> type = ClassTypeInformation.from(clazz);
                    String alias = documentTypeAnnotation.value();

                    aliasToTypeMap.put(alias, type);
                    typeToAliasMap.put(type, alias);

                } catch (ClassNotFoundException e) {
                    throw new IllegalStateException(String.format("Class [%s] could not be loaded.", bd.getBeanClassName()), e);
                }
            }
        }
    }

    @Override
    public TypeInformation<?> resolveTypeFrom(Alias alias) {
        final String aliasAsString = alias.mapTyped(String.class);
        if (aliasAsString != null && aliasToTypeMap.containsKey(aliasAsString)) {
            return aliasToTypeMap.get(aliasAsString);
        }
        return null;
    }

    @Override
    public Alias createAliasFor(TypeInformation<?> typeInformation) {
        if (typeToAliasMap.containsKey(typeInformation)) {
            return Alias.of(typeToAliasMap.get(typeInformation));
        }
        return Alias.NONE;
    }

    public static class Builder {
        List<String> basePackagesToScan;

        public Builder() {
            basePackagesToScan = new ArrayList<>();
        }

        public Builder withBasePackage(String basePackage) {
            basePackagesToScan.add(basePackage);
            return this;
        }

        public Builder withBasePackages(String[] basePackages) {
            basePackagesToScan.addAll(Arrays.asList(basePackages));
            return this;
        }

        public Builder withBasePackages(Collection< ? extends String> basePackages) {
            basePackagesToScan.addAll(basePackages);
            return this;
        }

        public DocumentTypeMapper build() {
            return new DocumentTypeMapper(basePackagesToScan);
        }
    }
}
