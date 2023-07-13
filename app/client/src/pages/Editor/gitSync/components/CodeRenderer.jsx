import { useState } from "react";

export function CodeBlock(props) {
    const [tags, setTags] = useState()

    const styles = {
        '[codeEditable]' : {
            outline: 'none'
        }
    };

    const backgroundColor = () => {
        if (props.conflict) {
            if (props.isAddition) {
                return "green"
            } else {
                return "red"
            }
        } else {
            return "white"
        }
    }

    const text = () => {
        if (props.conflict) {
            // console.log("props is ", props)
            const tag1 = preTagWithText(props.original, '#FFEBE9')
            const tag2 = preTagWithText(props.text, '#E6FFEC')
            return (
                <div>
                    {tag1}{tag2}
                </div>
            )
        } else {
            const tag = preTagWithText(props.text, "white")
            return (<div>
                {tag}
            </div>)
        }
    }

    const preTagWithText = (text, color) => {
        return <pre style={{margin: "0px", ...styles, backgroundColor:  color }} contenteditable="true">{text}</pre>
    }

    return (
        <div>
            {text()}
        </div>
        
        // (<pre style={{margin: "5px", ...styles, backgroundColor:  backgroundColor() }} contenteditable="true">{props.text}</pre>)
    )
}

export function CodeRenderer(props) {
    const textBlocks = () => {
        let blocks = []
        let blocksToIterate = props.blocks ?? []
        for (const block of blocksToIterate) {
            blocks.push(<CodeBlock {...block}></CodeBlock>)
        }
        return blocks
    }

    return (
        <div>
            {props.name}
            <div style={{height: "400px", overflow: "scroll", border: "1px solid black"}}>
                {textBlocks()}
            </div>
            
        </div>
    )
}