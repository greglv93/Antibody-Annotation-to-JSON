# Contributing

## pre-commit hooks

Ideally, all contributors should set up the pre-commit hooks defined in .pre-commit-config.yaml.
Formatting and linting hooks ensure that all code is consistently formatted and structured 
throughout the project's development and maintenance.
This helps keep the version control diffs clean - minimising the 'noise' of inconsistent formatting,
thus allowing developers to focus on the code's logic.
Other hooks run automated validation and unit tests upon any changes to the code, schema, or test cases.
If the changes break any tests that are expected to pass, the commit will be stopped unless the error is fixed.
However, there are ways to override this process if you wish (see below section on suppressing hooks).

### Instructions

First, install the pre-commit package manager (https://pre-commit.com/) with:

`pip install pre-commit`

Then, to write the .git/hooks/pre-commit file and initialise the hook environments, run:

`pre-commit install --install-hooks`

For some of the hooks, the following programs need to be installed and available to your system from the command line:

- https://github.com/sourcemeta/jsonschema

Now, all hooks in .pre-commit-config.yaml will automatically run on changed files (or further restricted to certain 
file patterns) whenever `git commit` is executed. If any hook fails (non-zero exit status), the commit is aborted.
Some hooks (like formatting) will automatically fix files, while others require manual changes based on inspection
of the hook output. When the necessary changes have been made, re-stage the file(s) and run `git commit` again.

### Suppressing hooks

If you don't like the changes made or suggested by a failing pre-commit hook and want to force the commit,
there are several options:

- Temporary local (not version-controlled) fixes that push decisions down the road:
    - re-run `git commit` but with the `--no-verify` option
    - 'turn off' pre-commit by either running `pre-commit uninstall`, or
    renaming the .git/hooks/pre-commit file e.g. by appending '-disabled'
    - remove automatic fixes in hook definitions e.g. `args: [--fix]` for ruff-check
    
- Or move the relevant hook definition from the main configuration to .pre-commit-optional.yaml. 
These hooks can be run manually with `pre-commit run [hook_id] --config ./.pre-commit-optional.yaml`

- Or add one or more file exceptions to the hook definition in .pre-commit.config.yaml.
This can be done with the 'exclude' keyword or by modifying the arguments in the 'entry' or 'args' line.

- Or if only part(s) of a file should be ignored by a formatting hook, write `# fmt: skip` at the end off the line,
or `# fmt: off` and `# fmt: on` at the beginning and end of a section. For suppression of the ruff linter,
use the `noqa` system (see https://docs.astral.sh/ruff/linter/#error-suppression)

 

