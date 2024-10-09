#!/bin/python

import os, sys, argparse, json, urllib.request, re, textwrap

SCANCODE_TAB = 0x000F
SCANCODE_ENTER = 0x001C
SCANCODES_NUMPAD = [
    0x45, 0xE035, 0x37, 0x4A,   ## NumLock, NumpadDivide, NumpadMultiply, NumpadSubtract
    0x47, 0x48,   0x49,         ## Numpad7, Numpad8, Numpad9
    0x4B, 0x4C,   0x4D, 0x4E,   ## Numpad4, Numpad5, Numpad6, NumpadAdd
    0x4F, 0x50,   0x51,         ## Numpad1, Numpad2, Numpad3
    0x52, 0x53,   0xE01C ]      ## Numpad0, NumpadDecimal, NumpadEnter

MODIFIER_NONE  = 0x00
MODIFIER_SHIFT = 0x01
MODIFIER_CTRL  = 0x02
MODIFIER_ALT   = 0x04

KLC_MODIFIER = {
    '0': MODIFIER_NONE,
    '1': MODIFIER_SHIFT,
    '2': MODIFIER_CTRL,
    '3': MODIFIER_SHIFT | MODIFIER_CTRL,
    '4': MODIFIER_ALT,
    '5': MODIFIER_SHIFT | MODIFIER_ALT,
    '6': MODIFIER_CTRL | MODIFIER_ALT,
    '7': MODIFIER_SHIFT | MODIFIER_CTRL | MODIFIER_ALT }

def parse_klc(kbd_id, klc_filename):
    re_trim_end = re.compile('[\t ]*(?://.*)?[\r\n]+$')
    re_split_fields = re.compile('\t+')
    key_modifier = [] ## array( int modifier_bitset, ... )
    keys = {}         ## dict( uint16 codepoint => array( uint16 scancode, int modifier ) )
    charset = {}      ## dict( uint16 codepoint => array( array( uint16 scancode, int modifier ), ... ) )
    kbd_description = None
    kbd_locale = None
    has_altgr = False
    section = None
    section_started = False
    section_dead_key = None

    charset[ord('\t')] = [[SCANCODE_TAB, MODIFIER_NONE]]
    charset[ord('\n')] = [[SCANCODE_ENTER, MODIFIER_NONE]]

    with open(klc_filename, 'r', encoding='utf-16') as f_in:
        for i_line, line in enumerate(f_in, start=1):
            line = re_trim_end.sub('', line)
            if len(line) == 0:
                if section and section_started:
                    section = None
                continue
            elif line[0] == ';':
                continue
            fields = re_split_fields.split(line)
            if section is None:
                if fields[0] == 'KBD':
                    kbd_description = fields[2].strip('"')
                elif fields[0] in ('COPYRIGHT', 'COMPANY', 'LOCALEID', 'VERSION'):
                    pass
                elif fields[0] == 'LOCALENAME':
                    kbd_locale = fields[1].strip('"')
                elif fields[0] in ('ATTRIBUTES', 'SHIFTSTATE', 'LAYOUT', 'DEADKEY', 'KEYNAME', 'KEYNAME_EXT', 'KEYNAME_DEAD'):
                    section = fields[0]
                    section_started = False
                    if fields[0] == 'DEADKEY':
                        deadkey_codepoint = int(fields[1], 16)
                        if deadkey_codepoint not in keys:
                            raise Exception(f'{klc_filename}:{i_line}: undefined DEADKEY' +
                                f' codepoint {hex(deadkey_codepoint)} "{chr(deadkey_codepoint)}"')
                        section_dead_key = keys[deadkey_codepoint]
                elif fields[0] == 'ENDKBD':
                    break
                else:
                    raise Exception(f'{klc_filename}:{i_line}: unknown KLC identifier {fields[0]}')
            else:
                if not section_started:
                    section_started = True
                if section == 'ATTRIBUTES':
                    if fields[0] == 'ALTGR':
                        has_altgr = True
                    else:
                        print(f'{klc_filename}:{i_line}: unknown KLC ATTRIBUTE "{fields[0]}" ignored', file=sys.stderr)
                elif section == 'SHIFTSTATE':
                    shiftstate_str = fields[0]
                    if shiftstate_str not in KLC_MODIFIER:
                        raise Exception(f'{klc_filename}:{i_line}: unknown KLC SHIFTSTATE {shiftstate_str}')
                    key_modifier.append(KLC_MODIFIER[shiftstate_str])
                elif section == 'LAYOUT':
                    if fields[0] == '-1':
                        continue
                    scancode = int(fields[0], 16)
                    if scancode in SCANCODES_NUMPAD:
                        continue
                    for i_codepoint, codepoint_str in enumerate(fields[ 3 : ]):
                        if codepoint_str == '-1' or codepoint_str == '0000':
                            continue
                        deadkey = codepoint_str.endswith('@')
                        if deadkey:
                            codepoint_str = codepoint_str[ : -1 ]
                        if len(codepoint_str) == 1:
                            codepoint = ord(codepoint_str)
                        elif len(codepoint_str) == 4:
                            codepoint = int(codepoint_str, 16)
                        else:
                            raise Exception(f'{klc_filename}:{i_line}: unknown codepoint syntax at scancode {hex(scancode)}')
                        if codepoint < 0x20 and codepoint != ord('\t') and codepoint != ord('\n'):
                            continue
                        modifier = key_modifier[i_codepoint]
                        if codepoint in keys:
                            prev_key = keys[codepoint]
                            prev_scancode = prev_key[0]
                            prev_modifier = prev_key[1]
                            prev_modifier_count = bin(prev_modifier).count('1')
                            modifier_count = bin(modifier).count('1')
                            if not (prev_scancode == scancode or prev_modifier_count < modifier_count or prev_modifier <= modifier):
                                print(f'{klc_filename}:{i_line}: overriding earlier definition of scancode {hex(prev_scancode)}'
                                    f' for codepoint {hex(codepoint)} "{chr(codepoint)}" with scancode {hex(scancode)}'
                                    f' (1st:{hex(prev_scancode)}+{prev_modifier} 2nd:{hex(scancode)}+{modifier})',
                                    file=sys.stderr)
                                prev_key[0] = scancode
                                prev_key[1] = modifier
                            continue
                        key = [scancode, modifier]
                        keys[codepoint] = key
                        if not deadkey:
                            charset[codepoint] = [key]
                elif section == 'DEADKEY':
                    codepoint = int(fields[1], 16)
                    if codepoint not in charset:
                        end_dead_codepoint = int(fields[0], 16)
                        if end_dead_codepoint not in keys:
                            raise Exception(f'{klc_filename}:{i_line}: undefined terminal codepoint' +
                                f' {hex(end_dead_codepoint)} "{chr(end_dead_codepoint)}"')
                        charset[codepoint] = [section_dead_key, keys[end_dead_codepoint]]

    if kbd_description is None:
        raise Exception(f'{klc_filename}: missing KBD definition')
    elif kbd_locale is None:
        raise Exception(f'{klc_filename}: missing LOCALENAME definition')
    return {
        'kbd_id': kbd_id,
        'description': kbd_description,
        'locale': kbd_locale,
        'has_altgr': has_altgr,
        'charset': dict(sorted(charset.items())) }

def trim_keyboard_charsets(keyboards):
    charset_us = None
    for keyboard in keyboards:
        if keyboard['kbd_id'] == 'kbdus':
            charset_us = keyboard['charset']
            break
    for keyboard_intl in keyboards:
        if keyboard_intl['kbd_id'] == 'kbdus':
            continue
        charset_missing = []
        charset_intl = keyboard_intl['charset']
        for codepoint_us, keys_us in charset_us.items():
            if codepoint_us not in charset_intl:
                charset_missing.append(codepoint_us)
                print(f'{keyboard_intl["kbd_id"]}: missing codepoint {codepoint_us} "{chr(codepoint_us)}"', file=sys.stderr)
            elif charset_intl[codepoint_us] == keys_us:
                del charset_intl[codepoint_us]
        if charset_missing:
            keyboard_intl['charset_missing'] = charset_missing

def main():
    parser = argparse.ArgumentParser(prog='import_kbd',
        description='Generates Unicode to keyboard scancode mappings.')
    parser.add_argument('-i', metavar='FILE', dest='in_filename',
        default='source_urls.json', help='input file name, default: source_urls.json')
    parser.add_argument('-o', metavar='FILE', dest='out_filename',
        default='keyboard_tables.js', help='output file name, default: keyboard_tables.js')
    args = parser.parse_args()

    keyboards = []
    os.makedirs('download', exist_ok=True)
    with open(args.in_filename) as f_in:
        for kbd_id, source_url in json.load(f_in).items():
            klc_filename = f'download/{kbd_id}.klc'
            if not os.path.exists(klc_filename):
                print(f'downloading keyboard definition "{kbd_id}" from {source_url}', file=sys.stderr)
                urllib.request.urlretrieve(source_url, klc_filename)
            keyboards.append(parse_klc(kbd_id, klc_filename))

    trim_keyboard_charsets(keyboards)

    print(f'writing keyboard mappings to {args.out_filename}', file=sys.stderr)
    with open(args.out_filename, 'w', encoding='utf-8') as f_out:
        print('/*', file=f_out)
        print(f' * NOTE: This file was auto-generated by {os.path.basename(__file__)}.', file=f_out)
        print(' */\n', file=f_out)
        print('export const KEYBOARD_TABLES =\n{', file=f_out)
        for i_keyboard, keyboard in enumerate(keyboards):
            line = (f'{keyboard["kbd_id"]}: {{'
                f'description: {json.dumps(keyboard["description"])}, '
                f'locale: {json.dumps(keyboard["locale"])}, '
                f'has_altgr: {json.dumps(keyboard["has_altgr"])}, '
                f'charset: {json.dumps(keyboard["charset"])}')
            if 'charset_missing' in keyboard:
                line += f', charset_missing: {json.dumps(keyboard["charset_missing"])}'
            line += '}'
            if i_keyboard > 0:
                print(',\n', file=f_out)
            print(textwrap.fill(line, break_on_hyphens=False, initial_indent=' '*4,
                subsequent_indent=' '*8), file=f_out, end='')
        print('\n};', file=f_out)

if __name__ == '__main__':
    main()
