package com.appsmith.fclass;

import com.google.auto.service.AutoService;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.FilerException;
import javax.annotation.processing.Processor;
import javax.annotation.processing.RoundEnvironment;
import javax.annotation.processing.SupportedAnnotationTypes;
import javax.annotation.processing.SupportedSourceVersion;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.ElementKind;
import javax.lang.model.element.TypeElement;
import javax.lang.model.element.VariableElement;
import javax.lang.model.type.DeclaredType;
import javax.lang.model.type.TypeMirror;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Set;

@SupportedAnnotationTypes({"com.appsmith.annotation.FClass", "org.springframework.data.mongodb.core.mapping.Document"})
@SupportedSourceVersion(SourceVersion.RELEASE_17)
@AutoService(Processor.class)
public class FClassProcessor extends AbstractProcessor {
    private static final String CLASS_PREFIX = "F";

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        for (TypeElement annotation : annotations) {
            for (Element el : roundEnv.getElementsAnnotatedWith(annotation)) {
                generateFor((TypeElement) el);
            }
        }

        return false;
    }

    private void generateFor(TypeElement classElement) {
        final String fullClassName = classElement.toString();

        final ClassInfo classInfo = ClassInfo.of(classElement);

        final String packageName = classInfo.packageName();
        final String fClassName = "F" + classInfo.className();
        final String fClassNameFull = packageName + "." + fClassName;

        DeclaredType superclass = (DeclaredType) classElement.getSuperclass();
        final ClassInfo superclassInfo = ClassInfo.of(superclass.asElement());
        if (superclassInfo.packageName().startsWith("com.appsmith.")) {
            generateFor((TypeElement) superclass.asElement());
        } else {
            superclass = null;
        }

        try (PrintWriter out = new PrintWriter(
                processingEnv.getFiler().createSourceFile(fClassNameFull).openWriter())) {
            // TODO: This code isn't very readable today. In Java 21, we can use STR templates to help with this.

            out.print("package ");
            out.print(packageName);
            out.println(";");
            out.println();

            out.println("import com.appsmith.fclass.Fielder;");
            out.println();

            out.println("import javax.annotation.processing.Generated;");
            out.println();

            out.println("/**");
            out.println(" * Generated field representation of " + classInfo.className() + ".");
            out.println(" * @see " + fullClassName);
            out.println(" */");
            out.println("@Generated(value = \"com.appsmith.fclass.FClassProcessor\", date = \"" + new java.util.Date()
                    + "\", comments=\"By " + hashCode() + "\")");
            out.print("public class ");
            out.print(fClassName);
            String fSuperclass = null;
            if (superclass != null) {
                fSuperclass = superclassInfo.packageName() + "." + CLASS_PREFIX + superclassInfo.className();
                out.print(" extends " + fSuperclass);
            }
            out.println(" {");
            out.println();

            final StringBuilder staticFieldsBuilder = new StringBuilder();
            final StringBuilder instanceFieldsBuilder = new StringBuilder();

            for (Element enclosedElement : classElement.getEnclosedElements()) {
                if (enclosedElement.getKind() == ElementKind.FIELD) {
                    final VariableElement field = (VariableElement) enclosedElement;
                    final TypeMirror fieldType = field.asType();
                    String constructor = "Fielder";

                    if (fieldType instanceof DeclaredType declaredType
                            && declaredType.toString().startsWith("com.appsmith.")) {
                        final TypeElement typeElement = (TypeElement) declaredType.asElement();
                        generateFor(typeElement);
                        final ClassInfo typeClassInfo = ClassInfo.of(typeElement);
                        constructor =
                                typeClassInfo.packageName() + "." + CLASS_PREFIX + typeClassInfo.className() + ".I";
                    }

                    final String fieldName = field.getSimpleName().toString();

                    // TODO: If the field has `@Deprecated` annotation, copy it over to the corresponding field as well.
                    // TODO: Add a docstring with `@see` link to the original field.

                    staticFieldsBuilder.append(String.format(
                            "    public static final %s %s = new %s(\"%s\");\n",
                            constructor, fieldName, constructor, fieldName));

                    instanceFieldsBuilder.append(String.format(
                            "        public final %s %s = new %s($path + \".%s\");\n",
                            constructor, fieldName, constructor, fieldName));
                }
            }

            out.print(staticFieldsBuilder);

            out.println();
            out.println("    public static class I extends " + (fSuperclass == null ? "Fielder" : (fSuperclass + ".I"))
                    + " {");
            out.println("        public I(String path) { super(path); }");

            out.print(instanceFieldsBuilder);

            out.println("    }");
            out.println("}");

        } catch (FilerException e) {
            // This is fine, it means the file already exists. (This is a common case in incremental compilation.)

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
