import CloseIcon from "assets/icons/ads/cross.svg";
import UpIcon from "assets/icons/ads/up-arrow.svg";
import { Colors } from "constants/Colors";
import { createGlobalStyle } from "styled-components";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/webcam/dist/style.css";

// Using the `&&` trick (which duplicates the selector) to increase specificity of custom styles. Otherwise,
// the custom styles may be overridden by @uppy/*.css imports – they have the same specificity,
// and which styles exactly will be applied depends on the order of imports.
const INCREASE_SPECIFICITY_SELECTOR = "&&";

export const FilePickerGlobalStyles = createGlobalStyle<{
  borderRadius?: string;
}>`

  /* Sets the font-family to theming font-family of the upload modal */
  .uppy-Root {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      font-family: var(--wds-font-family);
    }
  }

  /*********************************************************/
  /* Set the new dropHint upload icon */
  .uppy-Dashboard-dropFilesHereHint {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      background-image: none;
      border-radius: ${({ borderRadius }) => borderRadius};
    }
  }

  .uppy-Dashboard-dropFilesHereHint {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      &::before {
        border: 2.5px solid var(--wds-accent-color);
        width: 60px;
        height: 60px;
        border-radius: ${({ borderRadius }) => borderRadius};
        display: inline-block;
        content: ' ';
        position: absolute;
        top: 43%;
      }

      &::after {
        display: inline-block;
        content: ' ';
        position: absolute;
        top: 46%;
        width: 30px;
        height: 30px;

        -webkit-mask-image: url(${UpIcon});
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
        -webkit-mask-size: 30px;
        background: var(--wds-accent-color);
      }
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Set the styles for the upload button */
  .uppy-StatusBar-actionBtn--upload {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      background-color: var(--wds-accent-color) !important;
      border-radius: ${({ borderRadius }) => borderRadius};
    }
  }

  .uppy-Dashboard-Item-action--remove {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      /* Sets the border radius of the button when it is focused */
      &:focus {
        border-radius: ${({ borderRadius }) =>
          borderRadius === "0.375rem" ? "0.25rem" : borderRadius} !important;
      }

      .uppy-c-icon {
        & path:first-child {
        /* Sets the black background of remove file button hidden */
          visibility: hidden;
        }

        & path:last-child {
        /* Sets the cross mark color of remove file button */
          fill: #858282;
        }

        background-color: #FFFFFF;
        box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1);

        & {
        /* Sets the black background of remove file button hidden*/
          border-radius: ${({ borderRadius }) =>
            borderRadius === "0.375rem" ? "0.25rem" : borderRadius};
        }
      }
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Sets the back cancel button color to match theming primary color */
  .uppy-DashboardContent-back {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      color: var(--wds-accent-color);

      &:hover {
        color: var(--wds-accent-color);
        background-color: ${Colors.ATHENS_GRAY};
      }
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Sets the style according to reskinning for x button at the top right corner of the modal */
  .uppy-Dashboard-close {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      background-color: white;
      width: 32px;
      height: 32px;
      text-align: center;
      top: -33px;
      border-radius: ${({ borderRadius }) => borderRadius};

        & span {
          font-size: 0;
        }

        & span::after {
          content: ' ';
          -webkit-mask-image: url(${CloseIcon});
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          -webkit-mask-size: 20px;
          background: #858282;
          position: absolute;
          top: 32%;
          left: 32%;
          width: 12px;
          height: 12px;
        }
      }
    }
  }
  /*********************************************************/


  /*********************************************************/
  /* Sets the border radius of the upload modal */
  .uppy-Dashboard-inner {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      border-radius: ${({ borderRadius }) => borderRadius} !important;
    }
  }

  .uppy-Dashboard-innerWrap {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      border-radius: ${({ borderRadius }) => borderRadius} !important;
    }
  }

  .uppy-Dashboard-AddFiles {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      border-radius: ${({ borderRadius }) => borderRadius} !important;
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Sets the error message style according to reskinning*/
  .uppy-Informer {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      bottom: 82px;
      & p[role="alert"] {
        border-radius: ${({ borderRadius }) => borderRadius};
        background-color: transparent;
        color: #D91921;
        border: 1px solid #D91921;
      }
    }
  }
  /*********************************************************/

  /*********************************************************/
  /* Style the + add more files button on top right corner of the upload modal */
  .uppy-DashboardContent-addMore {
    ${INCREASE_SPECIFICITY_SELECTOR} {
      color: var(--wds-accent-color);
      font-weight: 400;
      &:hover {
        background-color: ${Colors.ATHENS_GRAY};
        color: var(--wds-accent-color);
      }

      & svg {
        fill: var(--wds-accent-color) !important;
      }
    }
  }
  /*********************************************************/

}
`;
