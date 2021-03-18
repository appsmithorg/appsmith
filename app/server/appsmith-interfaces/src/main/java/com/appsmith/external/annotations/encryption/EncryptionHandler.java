package com.appsmith.external.annotations.encryption;

import com.appsmith.external.models.AppsmithDomain;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.ClassUtils;
import org.springframework.util.ReflectionUtils;
import reactor.util.annotation.NonNull;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

@Slf4j
public class EncryptionHandler {

    Map<Class<?>, List<CandidateField>> encryptedFieldsMap = new ConcurrentHashMap<>();

    /**
     * This method finds all the candidate fields for a given type
     * Candidate fields will ony ever be fields that have either been directly annotated,
     * or are custom Appsmith types (and can hence have fields annotated for encryption within them)
     *
     * @param source document that needs to be checked for encrypted annotations
     * @return list of candidate fields for the given type and null if this list can not be found at this time
     */
    List<CandidateField> findCandidateFieldsForType(@NonNull Object source) {
        // At this point source class represents the true polymorphic type of the document
        Class<?> sourceClass = source.getClass();

        List<CandidateField> candidateFields = this.encryptedFieldsMap.get(sourceClass);

        if (candidateFields != null) {
            // The cache is already aware of this type, return candidate fields for it
            return candidateFields;
        }

        // Don't bother with primitives
        if (ClassUtils.isPrimitiveOrWrapper(sourceClass)) return Collections.emptyList();

        // If it is not known, scan each field for annotation or Appsmith type
        List<CandidateField> finalCandidateFields = new ArrayList<>();
        ReflectionUtils.doWithFields(sourceClass, field -> {
            if (field.getAnnotation(Encrypted.class) != null) {
                CandidateField candidateField = new CandidateField(field, CandidateField.Type.ANNOTATED_FIELD);
                finalCandidateFields.add(candidateField);
            } else if (AppsmithDomain.class.isAssignableFrom(field.getType())) {
                CandidateField candidateField = null;

                log.debug("Field name : {}", field.getName());
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
            }
        }, field -> field.getAnnotation(Encrypted.class) != null || AppsmithDomain.class.isAssignableFrom(field.getType()));
        // Update cache for next use
        encryptedFieldsMap.put(sourceClass, finalCandidateFields);

        return finalCandidateFields;
    }

    boolean convertEncryption(Object source, Function<String, String> transformer) {
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
                    ReflectionUtils.setField(field, source, transformer.apply(String.valueOf(fieldValue)));
                } else {
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
                    }
                }
            }
            field.setAccessible(false);
        }

        return hasEncryptedFields;
    }

}
