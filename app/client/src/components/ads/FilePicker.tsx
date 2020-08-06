import React, { useRef, useState } from "react";
import styled from "styled-components";
import Button, { Category, Size } from "./Button";
import axios from "axios";
import { ReactComponent as UploadIcon } from "../../assets/icons/ads/upload.svg";

const StyledDiv = styled("div")<{ isUploaded: boolean }>`
  width: 320px;
  height: 190px;
  background-color: rgba(35, 35, 36, 0.8);
  position: relative;

  #fileElem {
    display: none;
  }

  .bg-image {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    background-repeat: no-repeat;
    background-size: cover;
    /* background-size: 320px 190px; */
  }

  .file-description {
    position: absolute;
    width: 95%;
    bottom: 15px;
    left: 7.5px;
  }

  .file-spec {
    color: ${props => props.theme.colors.blackShades[9]};
    font-weight: ${props => props.theme.fontWeights[2]};
    font-size: ${props => props.theme.fontSizes[2]}px;
    line-height: ${props => props.theme.lineHeights[1]}px;
    letter-spacing: -0.18px;
    font-family: ${props => props.theme.fonts[3]};
    margin-bottom: ${props => props.theme.spaces[2]}px;

    span {
      margin-right: ${props => props.theme.spaces[4]}px;
    }
  }

  .progress-container {
    width: 100%;
    height: 4px;
    background: #9f9f9f;
    border-radius: 2.5px;
    transition: height 0.2s;
  }

  .progress-inner {
    background-color: #5bb749;
    transition: width 0.4s ease;
    height: 4px;
    border-radius: 2.5px;
    width: 0%;
  }

  .button-wrapper {
    text-align: center;

    svg {
      margin-bottom: 10px;
    }
  }

  .hoverDiv {
    display: none;
    position: absolute;
    bottom: 0;
    right: 0;
    background: linear-gradient(
      180deg,
      rgba(21, 17, 17, 0.0001) 0%,
      rgba(9, 7, 7, 0.883386) 100%
    );
    opacity: 0.6;
    width: 100%;

    button {
      margin: ${props => props.theme.spaces[13]}px
        ${props => props.theme.spaces[3]}px ${props => props.theme.spaces[3]}px
        auto;
    }
  }

  &:hover {
    .hoverDiv {
      display: ${props => (props.isUploaded ? "block" : "none")};
    }
  }
`;

function FilePicker() {
  const [filee, setFilee] = useState<any>({ name: "", size: 0 });
  const [isUploaded, setIsUploaded] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const fileDescRef = useRef<HTMLDivElement>(null);
  const fileContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (fileDescRef.current) {
      fileDescRef.current.style.display = "none";
    }
  }, []);

  function ButtonClick(e: any) {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.click();
    }
  }

  function handlee(el: any) {
    console.log("e", el.target.files);
    const file = el.target.files[0];
    setFilee({ name: file.name, size: Math.floor(file.size / 1024) });

    if (bgRef.current) {
      bgRef.current.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
      bgRef.current.style.backgroundColor = "#090707";
      bgRef.current.style.opacity = "0.5";
    }
    if (fileDescRef.current) {
      fileDescRef.current.style.display = "block";
    }
    if (fileContainerRef.current) {
      fileContainerRef.current.style.display = "none";
    }

    /* set form data and send api request */
    const formData = new FormData();
    formData.append("upload_preset", "zrawdjtc");
    formData.append("file", file);

    axios
      .post(
        "https://api.cloudinary.com/v1_1/dz7ahlubr/image/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: function(progressEvent: any) {
            const uploadPercentage = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100,
            );
            console.log("upload percentage", uploadPercentage);
            if (progressRef.current) {
              progressRef.current.style.width = `${uploadPercentage}%`;
            }
            if (uploadPercentage === 100) {
              setIsUploaded(true);
              if (fileDescRef.current && bgRef.current) {
                fileDescRef.current.style.display = "none";
                bgRef.current.style.opacity = "1";
              }
            }
          },
        },
      )
      .then(function() {
        console.log("SUCCESS!!");
      })
      .catch(function() {
        console.log("FAILURE!!");
      });
  }

  function removeImage() {
    if (fileContainerRef.current && bgRef.current) {
      fileContainerRef.current.style.display = "block";
      bgRef.current.style.backgroundImage = "url('')";
      bgRef.current.style.backgroundColor = "rgba(35,35,36,0.8)";
      setIsUploaded(false);
    }
  }

  return (
    <StyledDiv isUploaded={isUploaded}>
      <div ref={bgRef} className="bg-image">
        <div className="button-wrapper" ref={fileContainerRef}>
          <UploadIcon />
          <form>
            <input
              type="file"
              id="fileElem"
              multiple={false}
              ref={inputRef}
              onChange={el => handlee(el)}
            />
            <Button
              text={"Browse"}
              category={Category.tertiary}
              size={Size.medium}
              onClick={el => ButtonClick(el)}
            ></Button>
          </form>
        </div>
      </div>
      <div className="file-description" ref={fileDescRef} id="fileDesc">
        <div className="file-spec">
          <span>{filee.name}</span>
          <span>{filee.size}KB</span>
        </div>
        <div className="progress-container">
          <div className="progress-inner" ref={progressRef}></div>
        </div>
      </div>
      <div className="hoverDiv">
        <Button
          text={"remove"}
          icon={"delete"}
          size={Size.medium}
          category={Category.tertiary}
          onClick={el => removeImage()}
        ></Button>
      </div>
    </StyledDiv>
  );
}

export default FilePicker;
