/*
 * keyboard_lib.js (JavaScript module)
 * Helper class to generate and inject keyboard input into V86.
 *
 * Generates scancode sequences from Unicode text, implements
 * key-press and key-release codes, applies Shift, Control,
 * Alt, AltGr as required, supports dead keys.
 *
 * Generates scancode sequences from KeyboardEvent.code sequences.
 *
 * Provides a robust method for scancode injection into V86.
 *
 * Supports US and international keyboards.
 *
 * EXAMPLES
 *
 * A) Inject keystrokes Ctrl+Alt+Del into a running V86 instance "emulator"
 *
 *    const scancodes = VirtualKeyboard.ev_codes_to_scancodes(["ControlLeft", "AltLeft", "Delete"]);
 *    VirtualKeyboard.paste_scancodes(emulator, scancodes);
 *
 * B) Inject keystrokes for "Hello, world!" into a running V86 instance "emulator" using a US-keyboard
 *
 *    const keyboard = new VirtualKeyboard("kbdus");
 *    const scancodes = keyboard.text_to_scancodes("Hello, world!");
 *    VirtualKeyboard.paste_scancodes(emulator, scancodes);
 */

import { KEYBOARD_TABLES } from './keyboard_tables.js';

export class VirtualKeyboard
{
    // KeyboardEvent.code: string => scancode: uint16 mapping
    static EVCODE_TO_SCANCODE =
    {
        KeyA: 0x001E,
        KeyB: 0x0030,
        KeyC: 0x002E,
        KeyD: 0x0020,
        KeyE: 0x0012,
        KeyF: 0x0021,
        KeyG: 0x0022,
        KeyH: 0x0023,
        KeyI: 0x0017,
        KeyJ: 0x0024,
        KeyK: 0x0025,
        KeyL: 0x0026,
        KeyM: 0x0032,
        KeyN: 0x0031,
        KeyO: 0x0018,
        KeyP: 0x0019,
        KeyQ: 0x0010,
        KeyR: 0x0013,
        KeyS: 0x001F,
        KeyT: 0x0014,
        KeyU: 0x0016,
        KeyV: 0x002F,
        KeyW: 0x0011,
        KeyX: 0x002D,
        KeyY: 0x0015,
        KeyZ: 0x002C,
        Digit0: 0x000B,
        Digit1: 0x0002,
        Digit2: 0x0003,
        Digit3: 0x0004,
        Digit4: 0x0005,
        Digit5: 0x0006,
        Digit6: 0x0007,
        Digit7: 0x0008,
        Digit8: 0x0009,
        Digit9: 0x000A,
        Numpad1: 0x004F,
        Numpad2: 0x0050,
        Numpad3: 0x0051,
        Numpad4: 0x004B,
        Numpad5: 0x004C,
        Numpad6: 0x004D,
        Numpad7: 0x0047,
        Numpad8: 0x0048,
        Numpad9: 0x0049,
        Numpad0: 0x0052,
        Quote: 0x0028,
        Comma: 0x0033,
        Minus: 0x000C,
        Period: 0x0034,
        Slash: 0x0035,
        Semicolon: 0x0027,
        Equal: 0x000D,
        BracketLeft: 0x001A,
        BracketRight: 0x001B,
        Backquote: 0x0029,
        Backspace: 0x000E,
        Tab: 0x000F,
        Space: 0x0039,
        NumpadDecimal: 0x0053,
        NumpadSubtract: 0x004A,
        NumpadAdd: 0x004E,
        Enter: 0x001C,
        Escape: 0x0001,
        F1: 0x003B,
        F2: 0x003C,
        F3: 0x003D,
        F4: 0x003E,
        F5: 0x003F,
        F6: 0x0040,
        F7: 0x0041,
        F8: 0x0042,
        F9: 0x0043,
        F10: 0x0044,
        F11: 0x0057,
        F12: 0x0058,
        NumpadEnter: 0xE01C,
        NumpadDivide: 0xE035,
        NumpadMultiply: 0x0037,
        End: 0xE04F,
        ArrowDown: 0xE050,
        PageDown: 0xE051,
        ArrowLeft: 0xE04B,
        ArrowRight: 0xE04D,
        Home: 0xE047,
        ArrowUp: 0xE048,
        PageUp: 0xE049,
        Insert: 0xE052,
        Delete: 0xE053,
        ControlLeft: 0x001D,
        ShiftLeft: 0x002A,
        ShiftRight: 0x0036,
        CapsLock: 0x003A,
        NumLock: 0x0045,
        ScrollLock: 0x0046,
        AltLeft: 0x0038,
        AltRight: 0xE038,
        ControlRight: 0xE01D,
        Pause: 0xE11D,
        MetaLeft: 0xE05B,
        MetaRight: 0xE05C,
        ContextMenu: 0xE05D,
        Backslash: 0x002B,
        IntlBackslash: 0x0056
    };

    // scancode: uint16 => KeyboardEvent.code: string mapping
    static SCANCODE_TO_EVCODE = (() => {
        const result = {};
        for(const [ev_code, scancode] of Object.entries(this.EVCODE_TO_SCANCODE))
        {
            if(result.hasOwnProperty(scancode))
            {
                console.error(`SCANCODE_TO_EVCODE: multiple definitions for scancode ${hex(scancode)}`);
            }
            else
            {
                result[scancode] = ev_code;
            }
        }
        return result;
    })();

    static SCANCODE_SHIFT = this.EVCODE_TO_SCANCODE.ShiftLeft;
    static SCANCODE_CTRL  = this.EVCODE_TO_SCANCODE.ControlLeft;
    static SCANCODE_ALT   = this.EVCODE_TO_SCANCODE.AltLeft;
    static SCANCODE_ALTGR = this.EVCODE_TO_SCANCODE.AltRight;

    static SCANCODE_RELEASE_BIT = 0x80;

    static MODIFIER_NONE     = 0x00;
    static MODIFIER_SHIFT    = 0x01;
    static MODIFIER_CTRL     = 0x02;
    static MODIFIER_ALT      = 0x04;
    static MODIFIER_ALTGR    = 0x08;
    static MODIFIER_CTRL_ALT = this.MODIFIER_CTRL | this.MODIFIER_ALT;

    static paste_queue = [];    // array( array(scancode: uint16, ...), ...)

    encode_modifier = function(old_modifier, new_modifier, result)
    {
        if(old_modifier === new_modifier)
        {
            return;
        }

        const switch_modifier = function(modifier_bit, modifier_scancode)
        {
            if(old_modifier & modifier_bit ^ new_modifier & modifier_bit)
            {
                if(new_modifier & modifier_bit)
                {
                    result.push(modifier_scancode);
                }
                else
                {
                    result.push(modifier_scancode | VirtualKeyboard.SCANCODE_RELEASE_BIT);
                }
            }
        };

        switch_modifier(VirtualKeyboard.MODIFIER_SHIFT, VirtualKeyboard.SCANCODE_SHIFT);
        switch_modifier(VirtualKeyboard.MODIFIER_CTRL, VirtualKeyboard.SCANCODE_CTRL);
        switch_modifier(VirtualKeyboard.MODIFIER_ALT, VirtualKeyboard.SCANCODE_ALT);
        switch_modifier(VirtualKeyboard.MODIFIER_ALTGR, VirtualKeyboard.SCANCODE_ALTGR);
    };

    //
    // Public interface
    //

    /*
     * get_available_keyboards() -> dict(keyboard_id: str -> keyboard_description: str)
     *
     * Return the set of available keyboards.
     */
    static get_available_keyboards()
    {
        const result = {};
        for(const [kbd_id, keyboard] of Object.entries(KEYBOARD_TABLES))
        {
            result[kbd_id] = keyboard.description;
        }
        return result;
    }

    /*
     * paste_scancodes(emulator: V86, scancodes: array(scancode: uint16, ...))
     *
     * Inject scancodes into PS2 keyboard input buffer to emulate keystrokes.
     * Maintain queue of pending blocks of scancode sequences.
     * Throttle by spoon-feeding the scancodes in small bursts:
     * - send not more than 15 scancode bytes per burst
     * - pause 100ms after each burst
     * - prevent fragmenting 16-bit scancodes across bursts
     *
     * The receiving end of scancode injection will most likely be an
     * interrupt handler with an internal buffer of fixed size which
     * overflows unless throttled.
     *
     * While FreeDOS overflows at more than 30 bytes per burst, Linux can
     * handle 1024 (but not 2024, not tested in bewteen).
     *
     * Sending only half of a 16-bit scancode could be interpreted on
     * the receiving end as an error and cause the byte to be discarded.
     *
     * This static method does not block. Overlapping calls to this method
     * are sequentialized with an internal queue.
     */
    static async paste_scancodes(emulator, scancodes)
    {
        VirtualKeyboard.paste_queue.push(scancodes);
        if(VirtualKeyboard.paste_queue.length > 1)
        {
            // an unfinished paste loop is already running
            return;
        }
        const bus = emulator.keyboard_adapter.bus;
        for(; VirtualKeyboard.paste_queue.length > 0; VirtualKeyboard.paste_queue.shift())
        {
            let n_bytes_sent = 0;
            for(const scancode of VirtualKeyboard.paste_queue.at(0))
            {
                const n_bytes = scancode > 0xff ? 2 : 1;
                if(n_bytes_sent + n_bytes > 15)
                {
                    await new Promise(resolve => { setTimeout(resolve, 100) });
                    n_bytes_sent = 0;
                }
                if(n_bytes === 2)
                {
                    bus.send('keyboard-code', scancode >> 8);
                    bus.send('keyboard-code', scancode & 0xff);
                }
                else
                {
                    bus.send('keyboard-code', scancode);
                }
                n_bytes_sent += n_bytes;
            }
            if(n_bytes_sent)
            {
                await new Promise(resolve => { setTimeout(resolve, 100) });
            }
        }
    }

    constructor(kbd_id)
    {
        if(!KEYBOARD_TABLES.hasOwnProperty(kbd_id))
        {
            throw new Error(`unknown keyboard id ${kbd_id}`);
        }
        const keyboard = KEYBOARD_TABLES[kbd_id];
        if(kbd_id !== 'kbdus' && !keyboard.hasOwnProperty('charset_initialized'))
        {
            // Unpack non-US charset: insert all US-codepoint mappings into keyboard.charset that are
            // a) not defined in keyboard.charset and
            // b) not element of keyboard.charset_missing
            // NOTE: Not all keyboard charsets are an exact superset of the US-keyboard's,
            //       for example the Italian keyboard "kbdit" lacks "~" and "`".
            const charset = keyboard.charset;
            const charset_missing = keyboard.hasOwnProperty('charset_missing') ? keyboard.charset_missing : [];
            for(const [codepoint_str, us_keys] of Object.entries(KEYBOARD_TABLES['kbdus'].charset))
            {
                const codepoint = parseInt(codepoint_str);
                if(!charset.hasOwnProperty(codepoint) && !charset_missing.includes(codepoint))
                {
                    // deep copy us_keys: array(array(scancode, modifier), ...)
                    charset[codepoint] = JSON.parse(JSON.stringify(us_keys));
                }
            }
            // Non-US keyboards may feature an AltGr-key, translate Ctrl+Alt modifier to AltGr
            if(keyboard.has_altgr)
            {
                for(const keys of Object.values(charset))
                {
                    for(const key of keys)
                    {
                        if((key[1] & VirtualKeyboard.MODIFIER_CTRL_ALT) === VirtualKeyboard.MODIFIER_CTRL_ALT)
                        {
                            key[1] = (key[1] & ~VirtualKeyboard.MODIFIER_CTRL_ALT) | VirtualKeyboard.MODIFIER_ALTGR;
                        }
                    }
                }
            }
            keyboard.charset_initialized = true;
        }

        this.id = kbd_id;
        this.description = keyboard.description;
        this.locale = keyboard.locale;
        this.has_altgr = keyboard.has_altgr;
        this.charset = keyboard.charset;
    }

    /*
     * text_to_scancodes(text: str) -> array(scancode: uint16, ...)
     *
     * Transcode unicode text to sequence of keyboard-specific scancodes.
     *
     * Return array of 16-bit scancodes.
     */
    text_to_scancodes(text)
    {
        const charset = this.charset;
        const result = [];
        let modifier = VirtualKeyboard.MODIFIER_NONE;

        for(const chr of text)
        {
            const codepoint = chr.codePointAt(0);
            if(charset.hasOwnProperty(codepoint))
            {
                for(const key of charset[codepoint])
                {
                    const scancode = key[0];
                    const new_modifier = key[1];
                    this.encode_modifier(modifier, new_modifier, result);
                    modifier = new_modifier;
                    result.push(scancode);
                    result.push(scancode | VirtualKeyboard.SCANCODE_RELEASE_BIT);
                }
            }
            else
            {
                console.warn(`keyboard "${this.id}" does not support codepoint ${codepoint} "${chr}"`);
            }
        }

        this.encode_modifier(modifier, VirtualKeyboard.MODIFIER_NONE, result);
        return result;
    }

    /*
     * ev_codes_to_scancodes(ev_codes: array(ev_code: string, ...)) -> array(scancode: uint16, ...)
     *
     * Transcode KeyboardEvent.code sequence to sequence of scancodes.
     * Key-press scancodes are generated in the given order of ev_code[],
     * followed by key-release scancodes in reverse order.
     *
     * Return array of 16-bit scancodes.
     */
    static ev_codes_to_scancodes(ev_codes)
    {
        const EVCODE_TO_SCANCODE = VirtualKeyboard.EVCODE_TO_SCANCODE;
        const result = [];

        for(const ev_code of ev_codes)
        {
            if(EVCODE_TO_SCANCODE.hasOwnProperty(ev_code))
            {
                result.push(EVCODE_TO_SCANCODE[ev_code]);
            }
            else
            {
                console.warn(`unknown KeyboardEvent.code "${ev_code}"`);
            }
        }

        for(const scancode of result.slice().reverse())
        {
            result.push(scancode | VirtualKeyboard.SCANCODE_RELEASE_BIT);
        }

        return result;
    }
}
