/*
 * keyboard_lib.js (JavaScript module)
 */

import { KEYBOARD_TABLES } from './keyboard_tables.js';

// KeyboardEvent.code: string => scancode: uint16 mapping
export const EVCODE_TO_SCANCODE =
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
export const SCANCODE_TO_EVCODE = (() => {
    const result = {};
    for(const [ev_code, scancode] of Object.entries(EVCODE_TO_SCANCODE))
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

const SCANCODE_RELEASE_BIT = 0x80;

export const SCANCODE_SHIFT = EVCODE_TO_SCANCODE.ShiftLeft;
export const SCANCODE_CTRL  = EVCODE_TO_SCANCODE.ControlLeft;
export const SCANCODE_ALT   = EVCODE_TO_SCANCODE.AltLeft;
export const SCANCODE_ALTGR = EVCODE_TO_SCANCODE.AltRight;

export const MODIFIER_NONE     = 0x00;
export const MODIFIER_SHIFT    = 0x01;
export const MODIFIER_CTRL     = 0x02;
export const MODIFIER_ALT      = 0x04;
export const MODIFIER_ALTGR    = 0x08;
export const MODIFIER_CTRL_ALT = MODIFIER_CTRL | MODIFIER_ALT;

function encode_modifier(old_modifier, new_modifier, result)
{
    if(old_modifier === new_modifier)
    {
        return old_modifier;
    }

    const switch_modifier = function(modifier_bit, modifier_scancode)
    {
        if((old_modifier ^ new_modifier) & modifier_bit)
        {
            if(new_modifier & modifier_bit)
            {
                result.push(modifier_scancode);
            }
            else
            {
                result.push(modifier_scancode | SCANCODE_RELEASE_BIT);
            }
        }
    };

    switch_modifier(MODIFIER_SHIFT, SCANCODE_SHIFT);
    switch_modifier(MODIFIER_CTRL, SCANCODE_CTRL);
    switch_modifier(MODIFIER_ALT, SCANCODE_ALT);
    switch_modifier(MODIFIER_ALTGR, SCANCODE_ALTGR);
    return new_modifier;
};

/*
 * get_available_keyboards() -> dict(keyboard_id: str -> keyboard_description: str)
 *
 * Return the set of available keyboards.
 */
export function get_available_keyboards()
{
    const result = {};
    for(const [kbd_id, keyboard] of Object.entries(KEYBOARD_TABLES))
    {
        result[kbd_id] = keyboard.description;
    }
    return result;
}

/*
 * get_keyboard(kbd_id: str) -> Object
 *
 * Return keyboard object of given kbd_id.
 */
export function get_keyboard(kbd_id)
{
    if(!KEYBOARD_TABLES.hasOwnProperty(kbd_id))
    {
        throw new Error(`unknown keyboard id ${kbd_id}`);
    }
    const keyboard = KEYBOARD_TABLES[kbd_id];

    if(!keyboard.hasOwnProperty('keyboard_initialized'))
    {
        if(kbd_id !== 'kbdus')
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
                const codepoint = codepoint_str.codePointAt(0);
                if(!charset.hasOwnProperty(codepoint_str) && !charset_missing.includes(codepoint))
                {
                    // deep copy us_keys: array(array(scancode, modifier), ...)
                    charset[codepoint_str] = JSON.parse(JSON.stringify(us_keys));
                }
            }

            // Non-US keyboards may feature an AltGr-key, translate Ctrl+Alt modifier to AltGr
            if(keyboard.has_altgr)
            {
                for(const keys of Object.values(charset))
                {
                    for(const key of keys)
                    {
                        if((key[1] & MODIFIER_CTRL_ALT) === MODIFIER_CTRL_ALT)
                        {
                            key[1] = (key[1] & ~MODIFIER_CTRL_ALT) | MODIFIER_ALTGR;
                        }
                    }
                }
            }
        }

        // Add scancodes of universal non-visible characters below 0x20
        keyboard.charset['\t'] = [[EVCODE_TO_SCANCODE.Tab, MODIFIER_NONE]]
        keyboard.charset['\n'] = [[EVCODE_TO_SCANCODE.Enter, MODIFIER_NONE]]

        keyboard.kbd_id = kbd_id;
        keyboard.keyboard_initialized = true;
    }

    return keyboard;
}

/*
 * text_to_scancodes(keyboard: str|Keyboard, text: str) -> array(scancode: uint16, ...)
 *
 * Transcode unicode text to sequence of keyboard-specific scancodes.
 *
 * Return array of 16-bit scancodes.
 */
export function text_to_scancodes(keyboard, text)
{
    if(typeof keyboard === 'string')
    {
        keyboard = get_keyboard(keyboard);
    }
    const charset = keyboard.charset;
    const result = [];
    let modifier = MODIFIER_NONE;

    for(const chr of text)
    {
        const codepoint = chr.codePointAt(0);
        if(charset.hasOwnProperty(chr))
        {
            for(const key of charset[chr])
            {
                const scancode = key[0];
                const new_modifier = key[1];
                modifier = encode_modifier(modifier, new_modifier, result);
                result.push(scancode);
                result.push(scancode | SCANCODE_RELEASE_BIT);
            }
        }
        else
        {
            console.warn(`keyboard "${keyboard.kbd_id}" does not support codepoint ${codepoint} "${chr}"`);
        }
    }

    encode_modifier(modifier, MODIFIER_NONE, result);
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
export function ev_codes_to_scancodes(ev_codes)
{
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
        result.push(scancode | SCANCODE_RELEASE_BIT);
    }

    return result;
}

/*
 * paste_scancodes(emulator: V86, scancodes: array(scancode: uint16, ...))
 *
 * Inject scancodes into PS2 keyboard input buffer to emulate keystrokes.
 * Throttle by spoon-feeding scancodes in small bursts:
 * - send not more than 15 scancode bytes per burst
 * - prevent fragmenting 16-bit scancodes across bursts
 * - pause 100ms after each burst
 *
 * Sending only half of a 16-bit scancode could be interpreted on
 * the receiving end as an error and cause the byte to be discarded.
 *
 * This function does not block. Overlapping calls to this function
 * throw an error.
 */

const BURST_INTERVAL_MS = 100;
const MAX_BURST_SIZE = 15;
let paste_timeout_id = 0;

export function paste_scancodes(emulator, scancodes)
{
    if(paste_timeout_id)
    {
        throw new Error(`another call to past_scancodes() is actively running, aborted`);
    }

    const bus = emulator.keyboard_adapter.bus;
    let i_scancode = 0;
    function paste_loop()
    {
        let n_bytes_sent = 0;
        while(i_scancode < scancodes.length)
        {
            const scancode = scancodes[i_scancode];
            const n_bytes = scancode > 0xff ? 2 : 1;
            if(n_bytes_sent + n_bytes > MAX_BURST_SIZE)
            {
                paste_timeout_id = setTimeout(paste_loop, BURST_INTERVAL_MS);
                return;
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
            ++i_scancode;
            n_bytes_sent += n_bytes;
        }

        // done sending scancodes[] to emulator
        paste_timeout_id = 0;
    }

    paste_loop();
}

export function cancel_paste_scancodes()
{
    if(paste_timeout_id !== 0)
    {
        clearTimeout(paste_timeout_id);
        paste_timeout_id = 0;
    }
}
