# Keyboard module

JavaScript module that provides PC scancode sequence generation for US and international keyboards given a Unicode input string.

Supports all modifier keys <kbd>Shift</kbd>, <kbd>Ctrl</kbd>, <kbd>Alt</kbd> and <kbd>AltGr</kbd>, as well as [dead key](https://en.wikipedia.org/wiki/Dead_key) mechanics.

The underlying mapping data in [keyboard_tables.js](keyboard_tables.js) is converted from a user-defined set of .KLC files. A .KLC file is the Unicode-encoded output of Microsoft's Keyboard Layout Creator (MSKLC). KLC files for over 200 different keyboard layouts can be downloaded from https://kbdlayout.info/.

See https://chschnell.github.io/v86-i18n/keyboard-tables for an interactive visualisation of keyboard_tables.js.

## Generating keyboard_tables.js

Python script **[import_kbd.py](import_kbd.py)** generates [keyboard_tables.js](keyboard_tables.js) from a set of automatically downloaded .KLC files defined in [source_urls.json](source_urls.json).

### Usage

    $ python import_kbd.py -h
    usage: import_kbd [-h] [-i FILE] [-o FILE]

    Generates Unicode to keyboard scancode mappings.

    options:
      -h, --help  show this help message and exit
      -i FILE     input file name, default: source_urls.json
      -o FILE     output file name, default: keyboard_tables.js

## Using keyboard_tables.js

Copy Javascript modules **[keyboard_tables.js](keyboard_tables.js)** and **[keyboard_lib.js](keyboard_lib.js)** into your project, then use module [keyboard_lib.js](keyboard_lib.js) to access the keyboard mappings.

Example usage:

```HTML
<script type="module">

// import functions from module keyboard_lib.js (which imports keyboard_tables.js)
import * as kbd from './keyboard_lib.js';

// retrieve available keyboards
for(const [kbd_id, kbd_description] of Object.entries(kbd.get_available_keyboards()))
{
    // ...
}

const emulator = new V86({ ... });

// paste current clipboard content into V86
navigator.clipboard.readText().then((text) => {
    if(text.length) {
        // use keyboard with kbd_id "kbdgr" (German Keyboard Layout)
        const scancodes = kbd.text_to_scancodes("kbdgr", text);
        kbd.paste_scancodes(emulator, scancodes);
    }
});

// paste Ctrl+Alt+Del into V86 (non-printable keys, identical across all keyboard layouts)
// use key names from KeyboardEvent.code to identify both printable and non-printable keys
const scancodes = kbd.ev_codes_to_scancodes(["ControlLeft", "AltLeft", "Delete"]);
kbd.paste_scancodes(emulator, scancodes);

</script>
```

## See also

- [KeyboardEvent code Values: Standard "102" Keyboard Layout](https://www.w3.org/TR/uievents-code/#keyboard-102)
- [German layout scancodes](https://kbdlayout.info/KBDGR/scancodes)
- [German KLC file](https://kbdlayout.info/kbdgr/download/klc)
- [Encoding API Encodings](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)
- [Computer-Engineering.org (Adam Chapweske)](https://web.archive.org/web/20180302004814/https://computer-engineering.org/)
- [Italian keyboard](https://en.wikipedia.org/wiki/List_of_QWERTY_keyboard_language_variants#Italian) (Wikipedia, note the remark on ASCII characters tilde `~` and backquote `` ` ``)
