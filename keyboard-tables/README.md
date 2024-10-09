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

Copy Javascript modules **[keyboard_tables.js](keyboard_tables.js)** and **[keyboard_lib.js](keyboard_lib.js)** into your project, then use class `VirtualKeyboard` from module [keyboard_lib.js](keyboard_lib.js) to access the keyboard mappings.

Example usage:

```HTML
<script type="module">
// import module keyboard_lib.js (it imports keyboard_tables.js)
import { VirtualKeyboard } from "./keyboard_lib.js";

// retrieve available keyboards
for(const [kbd_id, kbd_description] of Object.entries(VirtualKeyboard.get_available_keyboards()))
{
    // ...
}

// instantiate VirtualKeyboard object for kbd_id "kbdgr" (German Keyboard Layout)
const keyboard = new VirtualKeyboard("kbdgr");

const emulator = new V86({ ... });

// async function that pastes current clipboard content into V86
async paste_from_clipboard()
{
    const text = await navigator.clipboard.readText();
    if(text.length)
    {
        const scancodes = keyboard.text_to_scancodes(text);
        await VirtualKeyboard.paste_scancodes(emulator, scancodes);
    }
}

// async function that pastes Ctrl+Alt+Del into V86 (non-printable keys, identical across all keyboard layouts)
async paste_ctrl_alt_del()
{
    // use key names from KeyboardEvent.code to identify non-printable keys
    const scancodes = VirtualKeyboard.ev_codes_to_scancodes(["ControlLeft", "AltLeft", "Delete"]);
    await VirtualKeyboard.paste_scancodes(emulator, scancodes);
}
</script>
```

## See also

- [KeyboardEvent code Values: Standard "102" Keyboard Layout](https://www.w3.org/TR/uievents-code/#keyboard-102)
- [German Layout Scancodes](https://kbdlayout.info/KBDGR/scancodes)
- [Encoding API Encodings](https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings)
- [Computer-Engineering.org (Adam Chapweske)](https://web.archive.org/web/20180302004814/https://computer-engineering.org/)
