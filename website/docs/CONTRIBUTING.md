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

Ideally, all contributors should set up the [pre-commit](https://pre-commit.com/) hooks defined in 
[this config file](./.pre-commit-config.yaml).
Formatting and linting hooks ensure that all code is consistently formatted and structured throughout the project's 
development and maintenance.
This helps keep the version control diffs clean - minimising the 'noise' of inconsistent formatting, thus allowing 
developers to focus on the code's logic.
Other hooks run automated validation and unit tests upon any changes to the code, schema, or test cases.
If the changes break any tests that are expected to pass, the commit will be stopped unless the error is fixed.
However, there are ways to override this process if you wish (see below section on suppressing hooks).
If you want a smoother 'format and commit' cycle (without having to re-stage fixed files),
run `pre-commit run --files <file(s)>` for the desired files before staging and committing the changes.

### Instructions

*Note that the pre-commit package manager should already have been installed from the dev dependencies in pyproject.toml*

To write your local `.git/hooks/pre-commit` file and initialise the hook environments, run:

```sh
pre-commit install --install-hooks
```

Now, all hooks in the [config file](./.pre-commit-config.yaml) will automatically run on changed files (or further 
restricted to certain file patterns) whenever `git commit` is executed. If any hook fails (non-zero exit status), the 
commit is aborted. Some hooks (like formatting) may automatically fix files, while others require manual changes based 
on inspection of the hook output. When the necessary fixes have been made, **re-stage** the file(s) and run `git commit` 
again.

**Warning**: If you don't like an automated fix, first run `git restore <file>` to restore the file from the staging 
area, which is left untouched by pre-commit (it only modifies the file in the working tree, which is also the reason 
why files with *wanted* automatic fixes need to be re-staged before committing). Then you can edit the `args` or `entry` 
in the hook definition (e.g. remove `args: [--fix]` for ruff-check, the Python linter). But note that an alternative 
manual fix must still pass the hook, unless the hook is suppressed in one of the ways outlined 
[below](#suppressing-hooks).

### Suppressing hooks

Some hooks may need to be temporarily disabled within feature/update branches. In particular, the test and validation 
hooks will need to be disabled during test-driven development (when the tests are expected to fail). In this case, the 
relevant hook definitions can be moved from the [main configuration](.pre-commit-config.yaml) to the
[optional configuration](.pre-commit-optional.yaml). These tests can then be run manually (without blocking any commits)
as follows: `pre-commit run [hook_id] --config ./.pre-commit-optional.yaml`. The hooks should be moved back to the main
pre-commit config before merging the feature/update branch with main.

Specific files or parts of files may also be temporarily (within a feature/update branch) or permanently (in the main 
branch) protected from one or more hooks. File exceptions can be added to a hook definition in the pre-commit 
configuration with the `exclude` keyword or by modifying the arguments in the `entry` or `args` line.
Or if only part(s) of a file should be ignored by a formatting hook, write `# fmt: skip` at the end off the line,
or `# fmt: off` and `# fmt: on` at the beginning and end of a section. For suppression of the ruff linter,
use the [`noqa` system](https://docs.astral.sh/ruff/linter/#error-suppression)

In case of bugs issues with one or more pre-commit hooks that arise from your local environment, there are a couple of 
workarounds:
   - Force through a `git commit` with the `--no-verify` option, or
   - Uninstall all hooks by running `pre-commit uninstall` or disabling them by renaming the .git/hooks/pre-commit file 
    e.g. by appending '-disabled'.
Note that these are workarounds don't involve any changes to files that are tracked by git. However, the repercussions 
(e.g. inconsistent code formatting) could affect files that are part of the shared repository. Therefore, they are 
intended as temporary fixes that push decisions down the road. For any commits forced through without the pre-commit 
checks, it would help to make other developers aware by appending a note to the commit message.

 
## Development Strategy

Below is a description of and rationale for the overall sequence/workflow of development and maintenance.
Feel free to raise an issue if something doesn't make sense (this applies to the rest of the repository as well).

### Some Guiding Principles 

- Start with the desired data structure, then work backwards to achieve it
- Some degree of test-driven development (TDD), but without prematurely optimising the tests for a specific 
pre-defined implementation (in terms of both the libraries/functions used and the broader logic of the code),
as these tests will be too brittle
- Schemas are code too: they can generate unintended/unexpected validation behaviour, and as such, they should be run 
past an automated unit testing suite, containing a 'ground truth' that covers as many base and edge cases as possible
- Prioritise accuracy, simplicity and maintainability; performance (execution time) is not particularly important, 
given the expected use case of one-time conversions of no more than ~1000 files
- Extensibility (or at least extendability), in anticipation of new annotation fields and more complicated antibody 
formats
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
		- [Sample input annotation files](./test/input_data),
		- Domain structure diagrams can be generated with [abYdraw](http://www.bioinf.org.uk/software/abydraw/)
		from AbML strings within the sample annotation files. This is useful for understanding complicated formats
		e.g. 12120.txt, a "bispecific human/humanized monoclonal Fab-Fc/Fab-Fc-Fab antibody" with a domain-swapped Fab

2. [Annotation mapping](./doc/annotation_format_mapping.md)
    - Group the INN annotation fields based on the most sensible JSON data structure, e.g. single strings, 
	arrays of objects, or single nested objects
    - Ensure the input and output data are conceptually linked, with all input fields mapped to JSON properties
        - `grep` the sample input files to find new fields not mentioned in the original documentation, e.g.
        `grep -ohP '^([^\[]+?)[\[\d,\]]*?:' ./test/input_data/* | grep -oP '^[^\[\(:]+' | sort -u` gives a sorted list 
        of all fields in the sample data
	- For JSON sub-properties, be guided by the description of each field in the documentation for the input data

3.  i. [JSON Schema](./doc/INN_antibody_schema.json) to formally describe and define constraints for the desired output 
data structure (refer to the [JSON Schema website](https://json-schema.org/) for documentation and tutorials)
        - Consult the descriptions in the original format documentation
        - Also `grep` the sample input data to see what range of values should be possible for each property

    ii. In parallel, write [test cases](./test/schema_tests) for each property in the schema, 
    so the schema can be updated and maintained in a test-driven way. Refer to the 
    [testing documentation](./test/README.md#json-schema-unit-testing-strategy) for guidance.

4. Pseudocode for the parser
    - Describe the logic of how to step through an input file, including error handling
	- Consult the mapping and schema
	- Add skeleton of empty classes and methods to the code in the [Python package](./antibody_annotation_to_json)
		- the ~80 annotation fields can be grouped and handled by ~20-30 methods, since many share the same 
		information structure

5.  i. Python unittest test suite (./test/*.py)
    - Consult mapping documentation and JSON schema when adding test cases for every unit in the Python code 
        skeleton
    
    ii. Python code for the parser [package](./antibody_annotation_to_json)
    - Fill in the skeleton of classes and methods
    - Consult the pseudocode, mapping and JSON schema
    - TDD: the tests will start off as failing (before all of the code is completed)
        - Tests will be configured in the [optional pre-commit config](./.pre-commit-optional.yaml) so they don't 
        automatically block commits

Development won't necessarily follow the exact order outlined above in one single pass; rather, it is more likely to 
involve an iterative cycle of changes. For instance, writing and testing the Python code might lead to new realisations 
about the viability/efficiency of converting to the desired data structure, in which case the JSON schema and annotation
mapping would have to be updated.

### Maintaining and Updating

Once the parser has reached a stable, functional form (producing valid output and passing all or most tests),
the pre-commit hooks for unit testing, running the parser on the sample input, and validating the output can
be moved from the [optional config](./.pre-commit-optional.yaml) to the [default config](./.pre-commit-config.yaml).
In addition, some of the output of the parser should be manually inspected as a sanity check.

When the parser needs to be updated to handle new annotation fields or to change the output format of existing ones, 
the appropriate changes should be made in the following places (see the above [workflow](#workflow) for guidance):
    
- mapping documentation,
- JSON schema and tests,
- parser source code (Python) and unit tests,
- test input data.

In any case, the 'cross-checking' between the parser, unit tests, and JSON schema validation will probably catch any 
incompatible updates.

The [test README](./test/README.md) includes a flowchart of the testing process and more information on how to edit or 
add new schema tests and Python unittest tests.

For ad hoc manual testing before committing local changes, use the `./input_data/` and `./json_files/` directories.
The contents of these directories are intended for local runs of the parser and are ignored by git.
The [./test/input_data/](./test/input_data/) and [./test/json_files/](./test/json_files/) directories are reserved for 
automated testing and validation. The test directories are not ignored by git, so the output generated by the latest 
version of the parser can be inspected.

### Changes to the Project Configuration

Whenever the [pyproject.toml](./pyproject.toml) file is updated, the project should be reinstalled for the changes to 
take effect. Use the following commands:

```
python3 -m pip uninstall antibody_annotation_to_json
python3 -m pip install --editable ".[dev]"
python3 -m pip install --force-reinstall sourcemeta-jsonschema
```

Also make sure to update requirements.txt if there are any changes to runtime dependencies.
