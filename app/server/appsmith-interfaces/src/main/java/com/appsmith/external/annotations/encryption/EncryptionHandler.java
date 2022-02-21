package com.appsmith.external.annotations.encryption;

import com.appsmith.external.models.AppsmithDomain;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.ClassUtils;
import org.springframework.util.ReflectionUtils;
import reactor.util.annotation.NonNull;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

@Slf4j
public class EncryptionHandler {

    Map<Class<?>, List<CandidateField>> encryptedFieldsMap = new ConcurrentHashMap<>();

    /**
     * This method finds all the candidate fields for a given type
     * Candidate fields will ony ever be fields that have either been directly annotated,
     * or are custom Appsmith types (and can hence have fields annotated for encryption within them),
     * or are parameterized collections of custom Appsmith types,
     * or are parameterized maps with custom Appsmith type values (keys are not scanned for encrypted fields)
     *
     * @param source document that needs to be checked for encrypted annotations
     * @return list of candidate fields for the given type and null if this list can not be found at this time
     */
    List<CandidateField> findCandidateFieldsForType(@NonNull Object source) {
        // At this point source class represents the true polymorphic type of the document
        Class<?> sourceClass = source.getClass();

        // Lock a thread wanting to find information about the same type
        // So that this information retrieval is only done once
        // Ignore this warning, this class reference will be on the heap
        List<CandidateField> candidateFields = this.encryptedFieldsMap.get(sourceClass);

        if (candidateFields != null) {
            // The cache is already aware of this type, return candidate fields for it
            return candidateFields;
        }

        // Don't bother with primitives
        if (ClassUtils.isPrimitiveOrWrapper(sourceClass)) return Collections.emptyList();

        // If it is not known, scan each field for annotation or Appsmith type
        List<CandidateField> finalCandidateFields = new ArrayList<>();
        synchronized (sourceClass) {
            ReflectionUtils.doWithFields(sourceClass, field -> {
                if (field.getAnnotation(Encrypted.class) != null) {
                    CandidateField candidateField = new CandidateField(field, CandidateField.Type.ANNOTATED_FIELD);
                    finalCandidateFields.add(candidateField);
                } else if (AppsmithDomain.class.isAssignableFrom(field.getType())) {
                    CandidateField candidateField = null;

                    field.setAccessible(true);
                    Object fieldValue = ReflectionUtils.getField(field, source);
                    if (fieldValue == null) {
                        if (this.encryptedFieldsMap.containsKey(field.getType())) {
                            // If this field is null, but the cache has a non-empty list of candidates already,
                            // then this is an appsmith field with known annotations
                            candidateField = new CandidateField(field, CandidateField.Type.APPSMITH_FIELD_KNOWN);
                        } else {
                            // If it is null and the cache is not aware of the field, this is still a prospect,
                            // but with an unknown type (could also be polymorphic)
                            candidateField = new CandidateField(field, CandidateField.Type.APPSMITH_FIELD_UNKNOWN);
                        }
                    } else {
                        // If an object exists, check if the object type is the same as the field type
                        CandidateField.Type appsmithFieldType;
                        if (field.getType().getCanonicalName().equals(fieldValue.getClass().getCanonicalName())) {
                            // If they match, then this is going to be an appsmith known field
                            appsmithFieldType = CandidateField.Type.APPSMITH_FIELD_KNOWN;
                        } else {
                            // If not, then this field is polymorphic,
                            // it will need to be checked for type every time
                            appsmithFieldType = CandidateField.Type.APPSMITH_FIELD_POLYMORPHIC;
                        }
                        // Now, go into field type and repeat
                        List<CandidateField> candidateFieldsForType = findCandidateFieldsForType(fieldValue);

                        if (appsmithFieldType.equals(CandidateField.Type.APPSMITH_FIELD_POLYMORPHIC)
                                || !candidateFieldsForType.isEmpty()) {
                            // This type only qualifies as a candidate if it is polymorphic,
                            // or has a list of candidates
                            candidateField = new CandidateField(field, appsmithFieldType);
                        }
                    }

                    field.setAccessible(false);
                    if (candidateField != null) {
                        // This will only ever be null if the field value is populated,
                        // and is known to be a non-encryption related field
                        finalCandidateFields.add(candidateField);
                    }
                } else if (Collection.class.isAssignableFrom(field.getType()) &&
                        field.getGenericType() instanceof ParameterizedType) {
                    // If this is a collection, check if the Type parameter is an AppsmithDomain
                    Type[] typeArguments;
                    ParameterizedType parameterizedType = (ParameterizedType) field.getGenericType();
                    typeArguments = parameterizedType.getActualTypeArguments();

                    Class<?> subFieldType;
                    try {
                        subFieldType = (Class<?>) typeArguments[0];
                    } catch (ClassCastException|ArrayIndexOutOfBoundsException e) {
                        subFieldType = null;
                    }
                    if(subFieldType != null) {
                        if (this.encryptedFieldsMap.containsKey(subFieldType)) {
                            // This is a known type, it should necessarily be of AppsmithDomain type
                            assert AppsmithDomain.class.isAssignableFrom(subFieldType);
                            final List<CandidateField> existingSubTypeCandidates = this.encryptedFieldsMap.get(subFieldType);
                            if (!existingSubTypeCandidates.isEmpty()) {
                                finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_LIST_KNOWN));
                            }
                        } else if (AppsmithDomain.class.isAssignableFrom(subFieldType)) {
                            // If the type is not known, then this is either not parsed yet, or has polymorphic implementations

                            field.setAccessible(true);
                            Object fieldValue = ReflectionUtils.getField(field, source);
                            Collection<?> list = (Collection<?>) fieldValue;

                            if (list == null || list.isEmpty()) {
                                finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_LIST_UNKNOWN));
                            } else {
                                for (final Object o : list) {
                                    if (o == null) {
                                        continue;
                                    }
                                    if (o.getClass().getCanonicalName().equals(subFieldType.getTypeName())) {
                                        final List<CandidateField> candidateFieldsForListMember = findCandidateFieldsForType(o);
                                        if (candidateFieldsForListMember != null && !candidateFieldsForListMember.isEmpty()) {
                                            finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_LIST_KNOWN));
                                        }
                                    } else {
                                        finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_LIST_POLYMORPHIC));
                                    }
                                    break;
                                }
                            }
                            field.setAccessible(false);

                        }
                    }
                    // TODO Add support for nested collections
                } else if (Map.class.isAssignableFrom(field.getType()) &&
                        field.getGenericType() instanceof ParameterizedType) {
                    Type[] typeArguments;
                    ParameterizedType parameterizedType = (ParameterizedType) field.getGenericType();
                    typeArguments = parameterizedType.getActualTypeArguments();
                    Class<?> subFieldType = (Class<?>) typeArguments[1];

                    if (this.encryptedFieldsMap.containsKey(subFieldType)) {
                        // This is a known type, it should necessarily be of AppsmithDomain type
                        assert AppsmithDomain.class.isAssignableFrom(subFieldType);
                        final List<CandidateField> existingSubTypeCandidates = this.encryptedFieldsMap.get(subFieldType);
                        if (!existingSubTypeCandidates.isEmpty()) {
                            finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_MAP_KNOWN));
                        }
                    } else if (AppsmithDomain.class.isAssignableFrom(subFieldType)) {
                        // If the type is not known, then this is either not parsed yet, or has polymorphic implementations

                        field.setAccessible(true);
                        Object fieldValue = ReflectionUtils.getField(field, source);
                        Map<?, ?> map = (Map<?, ?>) fieldValue;
                        if (map == null || map.isEmpty()) {
                            finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_MAP_UNKNOWN));
                        } else {
                            for (Map.Entry<?, ?> entry : map.entrySet()) {
                                final Object value = entry.getValue();
                                if (value == null) {
                                    continue;
                                }
                                if (value.getClass().getCanonicalName().equals(subFieldType.getTypeName())) {
                                    final List<CandidateField> candidateFieldsForListMember = findCandidateFieldsForType(value);
                                    if (candidateFieldsForListMember != null && !candidateFieldsForListMember.isEmpty()) {
                                        finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_MAP_KNOWN));
                                    }
                                } else {
                                    finalCandidateFields.add(new CandidateField(field, CandidateField.Type.APPSMITH_MAP_POLYMORPHIC));
                                }
                                break;
                            }
                        }
                        field.setAccessible(false);
                    }
                }

            }, field -> field.getAnnotation(Encrypted.class) != null ||
                    AppsmithDomain.class.isAssignableFrom(field.getType()) ||
                    Collection.class.isAssignableFrom(field.getType()) ||
                    Map.class.isAssignableFrom(field.getType()));
        }
        // Update cache for next use
        encryptedFieldsMap.put(sourceClass, finalCandidateFields);

        return finalCandidateFields;
        
    }

    synchronized boolean convertEncryption(Object source, Function<String, String> transformer) {
        if (source == null) {
            return false;
        }

        boolean hasEncryptedFields = false;

        // find the candidate fields for this object
        List<CandidateField> candidateFields = this.findCandidateFieldsForType(source);

        if (!candidateFields.isEmpty()) {
            hasEncryptedFields = true;
        }

        // if it is a known type, go to sub type and convert
        // if it is a polymorphic type, go to specific subtype for convert
        // if it is an unknown type, go to specific subtype for convert and update the current candidate field with the verdict
        Iterator<CandidateField> candidateFieldIterator = candidateFields.iterator();
        while (candidateFieldIterator.hasNext()) {
            CandidateField candidateField = candidateFieldIterator.next();
            Field field = candidateField.getField();
            field.setAccessible(true);
            Object fieldValue = ReflectionUtils.getField(field, source);
            // if this field is null, skip
            if (fieldValue != null) {
                if (CandidateField.Type.ANNOTATED_FIELD.equals(candidateField.getType())) {
                    // For each known field, encrypt if it is annotated
                    final String transformedValue = transformer.apply(String.valueOf(fieldValue));

                    ReflectionUtils.setField(field, source, transformedValue);
                } else if (Set.of(
                        CandidateField.Type.APPSMITH_FIELD_KNOWN,
                        CandidateField.Type.APPSMITH_FIELD_UNKNOWN,
                        CandidateField.Type.APPSMITH_FIELD_POLYMORPHIC)
                        .contains(candidateField.getType())) {
                    // or go into field type if it is not (this is an appsmith field)
                    boolean subTypeHasEncrypted = convertEncryption(fieldValue, transformer);
                    if (!subTypeHasEncrypted && field
                            .getType()
                            .getCanonicalName()
                            .equals(fieldValue.getClass().getCanonicalName())) {
                        // This is a previously unknown type that is actually irrelevant
                        candidateFieldIterator.remove();
                    } else {
                        // convert to polymorphic type if it has encrypted and is not the same type
                        // haven't done this yet because I'm considering whether we can just consider
                        // unknown types as polymorphic candidates over time
                        // If that is the case then do we need to store the candidate field type by
                        // known, unknown or polymorphic types at all?
                    }
                } else {
                    final Type[] typeNames = ((ParameterizedType) field.getGenericType()).getActualTypeArguments();
                    if (Set.of(
                            CandidateField.Type.APPSMITH_LIST_KNOWN,
                            CandidateField.Type.APPSMITH_LIST_UNKNOWN,
                            CandidateField.Type.APPSMITH_LIST_POLYMORPHIC)
                            .contains(candidateField.getType())) {
                        // This is a list which will necessarily have elements of AppsmithDomain type
                        boolean subTypeHasEncrypted = false;
                        for (Object o : (List<?>) fieldValue) {
                            subTypeHasEncrypted |= convertEncryption(o, transformer);
                        }
                        // The following condition will be true for unknown types when:
                        // none of the elements ended up being encrypted, and
                        // the list itself was not empty (if it was empty then we never really scanned anything), and
                        // the declared type of the list was the same as the first element (not polymorphic)
                        if (!subTypeHasEncrypted &&
                                !((List<?>) fieldValue).isEmpty() &&
                                typeNames[0].getTypeName().equals(((List<?>) fieldValue).get(0).getClass().getCanonicalName())) {
                            candidateFieldIterator.remove();
                        }
                    } else if (Set.of(
                            CandidateField.Type.APPSMITH_MAP_KNOWN,
                            CandidateField.Type.APPSMITH_MAP_UNKNOWN,
                            CandidateField.Type.APPSMITH_MAP_POLYMORPHIC)
                            .contains(candidateField.getType())) {
                        // This is a map that will necessarily have element values of AppsmithDomain type
                        boolean subTypeHasEncrypted = false;
                        boolean isPolymorphic = false;
                        final String typeName = typeNames[1].getTypeName();
                        for (Map.Entry<?, ?> entry : ((Map<?, ?>) fieldValue).entrySet()) {
                            subTypeHasEncrypted = subTypeHasEncrypted || convertEncryption(entry.getValue(), transformer);
                            isPolymorphic = isPolymorphic ||
                                    !typeName.equals(entry.getValue().getClass().getCanonicalName());
                        }
                        // The following condition will be true for unknown types when:
                        // none of the elements ended up being encrypted, and
                        // the map was not empty (if it was empty then we never really scanned anything), and
                        // the declared type of the values in the map was the same as the values in the map (not polymorphic)
                        if (!subTypeHasEncrypted &&
                                !((Map<?, ?>) fieldValue).isEmpty() &&
                                !isPolymorphic) {
                            candidateFieldIterator.remove();
                        }
                    }
                }
            }

            field.setAccessible(false);
        }

        return hasEncryptedFields;
    }
}
