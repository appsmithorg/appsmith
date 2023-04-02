package com.appsmith.server.domains;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.PageDTO;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.BeanSerializerFactory;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.IOException;

import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@NoArgsConstructor
@Document
@JsonSerialize(using = NewPage.NewPageSerializer.class)
public class NewPage extends BranchAwareDomain {

    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    PageDTO unpublishedPage;

    @JsonView(Views.Public.class)
    PageDTO publishedPage;

    @JsonView(Views.Import.class)
    @JsonProperty("page")
    public void setUnpublishedPage(PageDTO page) {
        this.unpublishedPage = page;
    }

    public static class NewPageSerializer extends JsonSerializer<NewPage> {

        @Override
        public void serialize(NewPage value, JsonGenerator generator, SerializerProvider provider) throws IOException {
            generator.writeStartObject();

            serializeProperties(value, generator, provider);
            
            generator.writeFieldName("page");
            if(provider.getActiveView() == Views.ExportUnpublished.class) {
                provider.defaultSerializeValue(value.getUnpublishedPage(), generator);
                //provider.findValueSerializer(PageDTO.class, null).serialize(value.getUnpublishedPage(), generator, provider);
            } else if(provider.getActiveView() == Views.ExportPublished.class) {
                provider.defaultSerializeValue(value.getPublishedPage(), generator);
                //provider.findValueSerializer(PageDTO.class, null).serialize(value.getPublishedPage(), generator, provider);
            } else {
                throw new RuntimeException("Invalid view");
            }

            generator.writeEndObject();
        }

        private void serializeProperties(NewPage value, JsonGenerator generator, SerializerProvider provider)
                throws JsonMappingException, IOException {
            JavaType javaType = provider.constructType(NewPage.class);
            BeanDescription beanDesc = provider.getConfig().introspect(javaType);
            JsonSerializer<Object> serializer = BeanSerializerFactory.instance.findBeanOrAddOnSerializer(provider, javaType, beanDesc, false);
            serializer.unwrappingSerializer(null).serialize(value, generator, provider);
        }

    }
}
