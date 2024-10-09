# Codepage module

JavaScript module that provides 8-Bit PC codepage to Unicode mappings.

## Generating codepage_tables.js

Python script **[import_cp.py](import_cp.py)** generates [codepage_tables.js](codepage_tables.js) from a set of automatically downloaded codepage mapping files defined in [source_urls.json](source_urls.json).

### Usage

    $ python import_cp.py -h
    usage: import_cp [-h] [-i FILE] [-o FILE]

    Generates 8-bit codepage to Unicode mappings.

    options:
      -h, --help  show this help message and exit
      -i FILE     input file name, default: source_urls.json
      -o FILE     output file name, default: codepage_tables.js

## Using codepage_tables.js

Copy Javascript modules **[codepage_tables.js](codepage_tables.js)** and **[codepage_lib.js](codepage_lib.js)** into your project, then use class `Codepage` from module [codepage_lib.js](codepage_lib.js) to access the codepage mappings.

Example usage:

```HTML
<script type="module">
// import class Codepage from module codepage_lib.js (which imports codepage_tables.js)
import { Codepage } from "./codepage_lib.js";

// retrieve available codepage mappings
for(const [cp_id, cp_description] of Object.entries(Codepage.get_available_codepages()))
{
    // ...
}

// instantiate Codepage object for cp_id "cp437" (DOS Latin US)
const codepage = new Codepage("cp437");

// use codepage in V86
const emulator = new V86({ ... });
emulator.v86.cpu.devices.vga.screen.set_charmap(codepage.charmap);
</script>
```
