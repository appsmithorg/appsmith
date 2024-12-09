// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import css from "!!raw-loader!./reset.css";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import script from "!!raw-loader!./customWidgetscript.js";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import appsmithConsole from "!!raw-loader!./appsmithConsole.js";

interface CreateHtmlTemplateProps {
  cssTokens: string;
  onConsole: boolean;
  srcDoc: { html: string; js: string; css: string };
}

export const createHtmlTemplate = (props: CreateHtmlTemplateProps) => {
  const { cssTokens, onConsole, srcDoc } = props;

  return ` <html>
    <head>
      <style>${css}</style>
      <style data-appsmith-theme>${cssTokens}</style>
    </head>
    <body>
      ${onConsole ? `<script type="text/javascript">${appsmithConsole}</script>` : ""}
      <script type="module">
        ${script}
        main();
      </script>
      ${srcDoc.html}
      <script type="module">${srcDoc.js}</script>
      <style>${srcDoc.css}</style>
    </body>
  </html>`;
};
