# Codepage module

Provides 8-Bit codepage-to-Unicode mappings as JavaScript code that can be imported as a module.

## Generating codepage_tables.js

Python script [import_cp.py](import_cp.py) generates [codepage_tables.js](codepage_tables.js) from a set of codepage mapping files defined in [source_urls.json](source_urls.json).

### Usage

    $ python import_cp.py -h
    usage: import_cp [-h] [-i FILE] [-o FILE]

    Generates 8-bit codepage to Unicode mappings.

    options:
      -h, --help  show this help message and exit
      -i FILE     input file name, default: source_urls.json
      -o FILE     output file name, default: codepage_tables.js

## Using codepage_tables.js

See class `Codepage` in [codepage_lib.js](codepage_lib.js) for usage examples.
