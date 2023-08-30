> Pull Request Template
>
> Use this template to quickly create a well written pull request. Delete all quotes before creating the pull request.
>
## Description
> Add a TL;DR when description is extra long (helps content team)
>
> Please include a summary of the changes and which issue has been fixed. Please also include relevant motivation
> and context. List any dependencies that are required for this change
>
> Links to Notion, Figma or any other documents that might be relevant to the PR
>
>
#### PR fixes following issue(s)
Fixes # (issue number)
> if no issue exists, please create an issue and ask the maintainers about this first
>
>
#### Media
> A video or a GIF is preferred. when using Loom, don’t embed because it looks like it’s a GIF. instead, just link to the video
>
>
#### Type of change
> Please delete options that are not relevant.
- Bug fix (non-breaking change which fixes an issue)
- New feature (non-breaking change which adds functionality)
- Breaking change (fix or feature that would cause existing functionality to not work as expected)
- Chore (housekeeping or task changes that don't impact user perception)
- This change requires a documentation update
>
>
>
## Testing
>
#### How Has This Been Tested?
> Please describe the tests that you ran to verify your changes. Also list any relevant details for your test configuration.
> Delete anything that is not relevant
- [ ] Manual
- [ ] JUnit
- [ ] Jest
- [ ] Cypress
>
>
#### Test Plan
> Add Testsmith test cases links that relate to this PR
>
>
#### Issues raised during DP testing
> Link issues raised during DP testing for better visiblity and tracking (copy link from comments dropped on this PR)
>
>
>
## Checklist:
#### Dev activity
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] PR is being merged under a feature flag


#### QA activity:
- [ ] [Speedbreak features](https://github.com/appsmithorg/TestSmith/wiki/Guidelines-for-test-plans#speedbreakers-) have been covered
- [ ] Test plan covers all impacted features and [areas of interest](https://github.com/appsmithorg/TestSmith/wiki/Guidelines-for-test-plans#areas-of-interest-)
- [ ] Test plan has been peer reviewed by project stakeholders and other QA members
- [ ] Manually tested functionality on DP
- [ ] We had an implementation alignment call with stakeholders post QA Round 2
- [ ] Cypress test cases have been added and approved by SDET/manual QA
- [ ] Added `Test Plan Approved` label after Cypress tests were reviewed
- [ ] Added `Test Plan Approved` label after JUnit tests were reviewed
