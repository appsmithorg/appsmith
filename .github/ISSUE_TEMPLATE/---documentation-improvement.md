name: Documentation
description: File a documentation request/report
title: "[Docs]: "
labels: ["📄 aspect: text", "✨ goal: improvement", "🚦 status: awaiting triage"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this documentation issue!

  - type: textarea
    id: detailed-description
    attributes:
      label: Detailed Description
      description: Add a detailed description of the issue.
      placeholder: A detailed description of the issue.
      value: "I found this documentation issue in this project where ..."
    validations:
      required: true

  - type: textarea
    attributes:
        label: Anything else?
        description: |
          Links? References? Anything that will give us more context about the issue you are encountering!
      
          Tip: You can attach images or log files by clicking this area to highlight it and then dragging files in.
    validations:
        required: false
