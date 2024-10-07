# Codepage module

Provides 8-Bit codepage-to-Unicode mappings as JavaScript code that can be imported as a module.

Before using `import_cp.py`, download the raw codepage definition files from www.unicode.org into this directory using:

    wget --mirror --no-parent --reject "index.html*" https://www.unicode.org/Public/MAPPINGS/

This command will create a directory subtree `./www.unicode.org` containing the raw codepage definition files.
