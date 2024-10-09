# Keyboard module

Converts keyboard layout data from KLC files into JavaScript code that can be imported as a module.

## Generating keyboard_tables.js

Python script [import_kbd.py](import_kbd.py) generates [keyboard_tables.js](keyboard_tables.js) from a set of keyboard layout files (.KLC) defined in [source_urls.json](source_urls.json).

A .KLC file is the Unicode-encoded output of Microsoft's Keyboard Layout Creator (MSKLC).

### Usage

    $ python import_kbd.py -h
    usage: import_kbd [-h] [-i FILE] [-o FILE]

    Generates Unicode to keyboard scancode mappings.

    options:
      -h, --help  show this help message and exit
      -i FILE     input file name, default: source_urls.json
      -o FILE     output file name, default: keyboard_tables.js

## Using keyboard_tables.js

See class `VirtualKeyboard` in [keyboard_lib.js](keyboard_lib.js) for usage examples.

## See also

- [KeyboardEvent code Values: Standard "102" Keyboard Layout](https://www.w3.org/TR/uievents-code/#keyboard-102)
- [German Layout Scancodes](https://kbdlayout.info/KBDGR/scancodes)
- [Encoding API Encodings](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)
- [Computer-Engineering.org (Adam Chapweske)](https://web.archive.org/web/20180302004814/https://computer-engineering.org/)
