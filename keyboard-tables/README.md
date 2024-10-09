# Keyboard module

Converts keyboard layout data from KLC files into JavaScript code that can be imported as a module.

## Generating keyboard_tables.js

Python script [import_kbd.py](import_kbd.py) generates [keyboard_tables.js](keyboard_tables.js) from a set of keyboard layout files (.KLC) defined in [source_urls.json](source_urls.json).

A .KLC file is the Unicode-encoded output of Microsoft's Keyboard Layout Creator (MSKLC).

## Using keyboard_tables.js

See class `VirtualKeyboard` in [keyboard_lib.js](keyboard_lib.js) for usage examples.

## SEE ALSO

- [KeyboardEvent code Values: Standard "102" Keyboard Layout](https://www.w3.org/TR/uievents-code/#keyboard-102)
- [German Layout Scancodes](https://kbdlayout.info/KBDGR/scancodes)
- [Encoding API Encodings](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)
- [Computer-Engineering.org (Adam Chapweske)](https://web.archive.org/web/20180302004814/https://computer-engineering.org/)
