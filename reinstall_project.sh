#!/usr/bin/env bash

# Uninstall and reinstall the project
# Used when the pyproject.toml file changes - triggered in .pre-commit-optional.yaml

python3 -m pip uninstall antibody_annotation_to_json
python3 -m pip install --editable .

# Makes any new dependencies in the reinstalled project available to other users who just want to use requirements.txt
python3 -m pip freeze > requirements.txt
