import openai
import os
import json
import subprocess

# Set up your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_suggestions(failing_test):
    response = openai.Completion.create(
        engine="code-davinci-002",
        prompt=f"Fix the following Jest test:\n\n{failing_test}\n\n# Fixed test",
        max_tokens=150
    )
    return response.choices[0].text.strip()

def find_failing_tests():
    with open('jest_results.json') as f:
        jest_results = json.load(f)

    # Extract failing test cases
    failing_tests = []
    for test_suite in jest_results['testResults']:
        for test_case in test_suite['assertionResults']:
            if test_case['status'] == 'failed':
                failing_tests.append(test_case['fullName'])

    return failing_tests

def main():
    failing_tests = find_failing_tests()
    if not failing_tests:
        print("No failing tests found.")
        return

    for i, test in enumerate(failing_tests):
        suggestion = get_suggestions(test)
        with open(f"fixed_test_{i}.js", "w") as file:
            file.write(suggestion)

if __name__ == "__main__":
    main()
