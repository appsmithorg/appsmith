import { compileSrcDoc } from "pages/Editor/CustomWidgetBuilder/utility";
import anvilTemplates from "pages/Editor/CustomWidgetBuilder/Editor/Header/CodeTemplates/Templates/anvilTemplates";

const anvilTemplate = anvilTemplates[1];

export default {
  uncompiledSrcDoc: anvilTemplate.uncompiledSrcDoc,
  srcDoc: compileSrcDoc(anvilTemplate.uncompiledSrcDoc).code,
};
