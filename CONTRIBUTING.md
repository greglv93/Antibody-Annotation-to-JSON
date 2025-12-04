# Contributing

## Getting Started

1. Install the project as an editable install a.k.a. development mode (refer to [these 
instructions](./README.md#installation))
2. Install the [pre-commit hooks](#pre-commit-hooks)
3. Consult the [development strategy](#development-strategy) outlined below. If the tool is already functional and the 
data structure and mapping makes sense, you may want to simply add some more unit tests for the source code or JSON 
schema to see if it aligns with your expectations. For substantive changes to the tool's behaviour, consult the 
[maintaining and updating section](#maintaining-and-updating). 

## Pre-commit Hooks

Ideally, all contributors should set up the pre-commit hooks defined in ./.pre-commit-config.yaml.
Formatting and linting hooks ensure that all code is consistently formatted and structured 
throughout the project's development and maintenance.
This helps keep the version control diffs clean - minimising the 'noise' of inconsistent formatting,
thus allowing developers to focus on the code's logic.
Other hooks run automated validation and unit tests upon any changes to the code, schema, or test cases.
If the changes break any tests that are expected to pass, the commit will be stopped unless the error is fixed.
However, there are ways to override this process if you wish (see below section on suppressing hooks).
If you want a smoother 'format and commit' cycle (without having to re-stage fixed files),
run `pre-commit run --files <file(s)>` for the desired files before staging and committing the changes.

### Instructions

First, install the pre-commit package manager (https://pre-commit.com/) with:

`pip install pre-commit`

Then, to write the ./.git/hooks/pre-commit file and initialise the hook environments, run:

`pre-commit install --install-hooks`

For some of the hooks, the following programs need to be installed and available to your system from the command line:

- https://github.com/sourcemeta/jsonschema

Now, all hooks in ./.pre-commit-config.yaml will automatically run on changed files (or further restricted to certain 
file patterns) whenever `git commit` is executed. If any hook fails (non-zero exit status), the commit is aborted.
Some hooks (like formatting) will automatically fix files, while others require manual changes based on inspection
of the hook output. If you don't like an automated fix, you can edit the `args` or `entry` in the hook definition 
(e.g. remove `args: [--fix]` for ruff-check, the python linter).
When the necessary fixes have been made, re-stage the file(s) and run `git commit` again.

### Suppressing hooks

If you don't like the changes made or suggested by a failing pre-commit hook and want to force the commit,
there are several options:

- Temporary local (not version-controlled) fixes that push decisions down the road. For any commits forced through 
without the pre-commit checks, it would help to make other developers aware by appending a note to the commit message.
    - Re-run `git commit` but with the `--no-verify` option, or
    - 'Turn off' pre-commit by either running `pre-commit uninstall`, or
    renaming the .git/hooks/pre-commit file e.g. by appending '-disabled'.
    
- Or move the relevant hook definition from the main configuration to .pre-commit-optional.yaml. 
These hooks can be run manually with `pre-commit run [hook_id] --config ./.pre-commit-optional.yaml`

- Or add one or more file exceptions to the hook definition in .pre-commit.config.yaml.
This can be done with the 'exclude' keyword or by modifying the arguments in the 'entry' or 'args' line.

- Or if only part(s) of a file should be ignored by a formatting hook, write `# fmt: skip` at the end off the line,
or `# fmt: off` and `# fmt: on` at the beginning and end of a section. For suppression of the ruff linter,
use the `noqa` system (see https://docs.astral.sh/ruff/linter/#error-suppression)

 
## Development Strategy

Below is a description of and rationale for the overall sequence/workflow of development and maintenance.
Feel free to raise an issue if something doesn't make sense (this applies to the rest of the repository as well).

### Some Guiding Principles 

- Start with the desired data structure, then work backwards to achieve it
- Some degree of test-driven development (TDD), but without prematurely optimising the tests for a specific 
pre-defined implementation (in terms of both the libraries/functions used and the broader logic of the code),
as these tests will be too brittle
- Prioritise accuracy, simplicity and maintainability; performance (execution time) is not that important
- Extensibility (or at least extendability), in anticipation of new annotation fields 
and more complicated antibody formats
- Appropriate specificity: don't attempt to solve too general a problem too soon
    - A full-scale state machine and parser is probably not needed; string operations and regular expressions are
    sufficient for this project's input data, which is relatively flat and not arbitrarily nested.
    The input data can be broken down into almost independent units, with the exception of Note records, of which a 
    potentially arbitrary number need to be linked to the preceding record or block of records. But this only goes
    one level deep, and can be handled with some custom logic.
				
### Workflow

1. Explore and understand the input data
	- Develop a sense of the ontology of annotations in relation to different levels of the antibody structure 
	(residue, domain, instance, chain, whole). Consult the following:
		- Prof. Andrew Martin's [original format documentation](./doc/INN_annotation_format.pdf), 
		- [Sample input annotation files](./test/input_data/),
		- Domain structure diagrams can be generated with [abYdraw](http://www.bioinf.org.uk/software/abydraw/)
		from AbML strings within the sample annotation files. This is useful for understanding complicated formats
		e.g. 12120.txt, a "bispecific human/humanized monoclonal Fab-Fc/Fab-Fc-Fab antibody" with a domain-swapped Fab

2. [Annotation mapping](./doc/annotation_mapping.md)
    - Group the INN annotation fields based on the most sensible JSON data structure, e.g. single strings, 
	arrays of objects, or single nested objects
    - Ensure the input and output data is conceptually linked, with all input fields mapped to JSON properties
        - `grep` the sample input files to find new fields not mentioned in the original documentation, e.g.
        `grep -ohP '^([^\[]+?)[\[\d,\]]*?:' ./test/input_data/* | grep -oP '^[^\[\(:]+' | sort -u` gives a sorted list 
        of all fields in the sample data
	- For JSON sub-properties, be guided by the description of each field in the documentation for the input data

3.  i. [JSON Schema](./doc/INN_antibody_schema.json) to formally describe and define constraints for the desired output 
data structure
        - Consult the descriptions in the original format documentation
        - Also `grep` the sample input data to see what range of values should be possible for each property

    ii. In parallel, write test cases for each property in the schema (./test/schema_tests), 
    so the schema can be updated and maintained in a test-driven way

4. Pseudocode for the parser/converter
    - Describe the logic of how to step through an input file, including error handling
	- Consult the mapping and schema
	- Add skeleton of empty classes and methods to the code in the python package (./antibody_annotation_to_json/)
		- the ~80 annotation fields can be grouped and handled by ~20-30 methods, since many share the same 
		information structure

5.  i. Python unittest test suite (./test/*.py)
    - Consult mapping documentation and JSON schema when adding test cases for every unit in the python code 
        skeleton
    
    ii. Python code for the parser/converter [package](./antibody_annotation_to_json/)
    - Fill in the skeleton of classes and methods
    - Consult the pseudocode, mapping and JSON schema
    - TDD: the tests will start off as failing (before all of the code is completed)
        - Tests will be configured in ./.pre-commit-optional.yaml so they don't automatically block commits

Development won't necessarily always follow the exact order outlined above.
For instance, writing and testing the python code might lead to new realisations about the viability/efficiency
of converting to the desired data structure, in which case the JSON schema and annotation mapping may have to be
updated.

### Maintaining and Updating

Once the parser/converter has reached a stable, functional form (producing valid output and passing all or most tests),
the pre-commit hooks for unit testing, running the parser/converter on the sample input, and validating the output can
be moved from ./.pre-commit-optional.yaml to ./.pre-commit-config.yaml.

When the parser/converter needs to be updated to handle new annotation fields or to change the output format of 
existing ones, the appropriate changes should be made in the following places:
    
- mapping documentation,
- JSON schema (refer to the [JSON Schema website](https://json-schema.org/) for documentation and tutorials),
- schema tests,
- python unit tests
- (if applicable) expected and invalid json files (used by schema and unittest test cases)

In any case, the 'cross-checking' between the parser/converter, unit tests, and JSON schema validation will probably
catch any incompatible updates.

See ./test/README.md for a flowchart of the testing process and more information on how to edit or add new schema tests
and python unittest tests.

For ad hoc manual testing before committing local changes, use the ./input_data/ and ./json_files/ directories.
The contents of these directories are ignored by git.
The ./test/input_data/ and ./test/json_files/ directories are reserved for automated testing and validation.
The test directories are not ignored by git, so the output generated by the latest version of the parser/converter can
be inspected.
