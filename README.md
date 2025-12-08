# Antibody-Annotation-to-JSON

This project is a Python-based CLI utility that parses and converts annotations for antibody-based therapeutics
from [this format](./doc/INN_annotation_format.pdf), designed by Prof. Andrew Martin, into structured JSON files. 
Internally, there are 3 main steps: 
1. Parsing the original flat text format and structuring the data into a python dict
2. Validation against a JSON schema
3. Serialises the output into a JSON file

It's ultimate purpose is to allow import of the converted data into a MongoDB database for further analysis and 
to make it accessible to researchers through a web front-end.

Features:
- Built-in validation against a JSON schema


## Installation

1. Clone the repo and move into it:
    
    `git clone https://github.com/pySin/Antibody-Annotation-to-JSON.git && cd Antibody-Annotation-to-JSON`

2. (Optional) Create a virtual environment to avoid cluttering your base environment and avoid conflicts with OS 
package managers such as Homebrew

    Linux/macOS: `python3 -m venv .venv/ && source .venv/bin/activate`
    
    Windows: `py -3 -m venv .venv\ && .venv\Scripts\activate`

3. Install with pip *(for Windows OSes, replace `python3` with `python` or `py -3`)*

   `python3 -m pip install --upgrade pip`
   
   For a regular installation:
   
   `python3 -m pip install .` <br>
   (`python3 -m pip install --upgrade .` needs to be run to update the installation with any changes to the source code)
   
   **For developers** who want an editable install with live feedback on changes to the code (also refer to the 
   [CONTRIBUTING](./CONTRIBUTING.md) guidelines):
   
   `python3 -m pip install --editable ".[dev]"`
   
   `python3 -m pip install --force-reinstall sourcemeta-jsonschema`
   
   The last line is important as it solves a CLI name conflict: sourcemeta's tool ships a `jsonschema` executable, but
   this can get replaced by the CLI executable from the Python `jsonschema` library, which is installed as a runtime 
   dependency for this project. The 'force-reinstall' command guarantees that sourcemeta's `jsonschema` CLI ends up on 
   top, overwriting the Python `jsonschema` library. The Python library is needed at runtime but its command-line 
   executable is not needed (and will in fact be deprecated in future versions), while sourcemeta's tool should be 
   available from the CLI, where it is needed for some pre-commit hooks and can also be invoked for manual testing and 
   exploration of the JSON schema.
   
   If the Python `jsonschema` library accidentally gets reinstalled and 'takes back' the CLI, run the 'force-reinstall'
   command again inside your project environment. 
   
   
## Usage

The tool is now available as an executable command from anywhere in your system terminal. To get started, run:

`antibody-to-json --help`


# Quick usage without installing the package

*(for Windows OSes, replace `python3` with `python` or `py -3`)*

1. Clone the repository and optionally create a virtualenv as in steps 1-2 [above](#installation).

2. Install only the dependencies

    `python3 -m pip install --upgrade pip`
    
    `python3 -m pip install -r requirements.txt`

3. From the project directory (the repository root), run:

    `python3 -m antibody_annotation_to_json.cli --help`


---
This project is licensed under the MIT License.

