#!/bin/python

import os, sys, argparse, json, urllib.request

def read_codepage_def(cp_filename, cp437=None):
    ## if cp437 is None then we are currently reading CP437
    codepoints_defined = 0
    result = [0] * 256
    with open(cp_filename) as f_in:
        for line_no, line_in in enumerate(f_in):
            line_in = line_in.strip()
            ## skip comments, empty lines and control characters
            if len(line_in) == 0 or line_in[0] == '#' or ord(line_in[0]) == 0x1a:
                ## 0x1a: ASCII ctrl char "SUB" (CTRL+Z), an end-of-file marker
                continue
            ## expected format of line:
            ##     "0x" <hex-char> "\t" "0x" <hex-codepoint> "\t" "#" <comment>
            line = line_in.split('\t')
            if len(line) != 3:
                raise Exception(f'{cp_filename}:{line_no}: unexpected line format: {line_in} {ord(line_in[0])}!')
            cp_char = int(line[0].strip(), 16)
            if cp_char > 255:
                raise Exception(f'{cp_filename}:{line_no}: invalid character code {cp_char}!')
            codepoint = line[1].strip()
            if not len(codepoint):
                ## fall back to CP437 for undefined codepoints, or (should not happen): use replacement character U+FFFD
                codepoint = cp437[cp_char] if cp437 else 0xfffd
            else:
                codepoint = int(codepoint, 16)
                if codepoint > 0xffff:
                    raise Exception(f'{cp_filename}:{line_no}: invalid codepoint {codepoint}!')
            result[cp_char] = codepoint
            codepoints_defined += 1
    if codepoints_defined != 256:
        raise Exception(f'{cp_filename}: unexpected number of codepoint defintions {codepoints_defined}!')
    return result[ 128 : ] if cp437 else result

def parse_codepages(cp_source_files):
    [cp437_filepath, cp437_description] = cp_source_files['cp437']
    cp437 = read_codepage_def(cp437_filepath)

    ## replace control characters in CP437 with printable characters defined in IBMGRAPH (optional)
    if 'ibmgraph' in cp_source_files:
        [ibmgraph_filepath, ibmgraph_description] = cp_source_files['ibmgraph']
        with open(ibmgraph_filepath) as f_in:
            for line_no, line_in in enumerate(f_in):
                if line_in[0] == '#':
                    continue
                line = line_in.rstrip().split('\t')
                if len(line) != 5:
                    raise Exception(f'{ibmgraph_filepath}:{line_no}: unexpected line format: {line_in}!')
                codepoint = int(line[0], 16)
                cp_char = int(line[1], 16)
                if cp_char > 0x7F:
                    ## Skipped from IBMGRAPH.TXT:
                    ##   0xB9: 0x2563
                    ##   0xBA: 0x2551
                    ##   0xBB: 0x2557
                    ##   0xBC: 0x255D
                    ##   0xC8: 0x255A
                    ##   0xC9: 0x2554
                    ##   0xCA: 0x2569
                    ##   0xCB: 0x2566
                    ##   0xCC: 0x2560
                    ##   0xCD: 0x2550
                    ##   0xCE: 0x256C
                    continue
                cp437[cp_char] = codepoint

    ## codepages: dict(str cp_id => [Uint8 charmap[128 or 256], str description] )
    codepages = {'cp437': [cp437, cp437_description]}

    for cp_id, [cp_filepath, description] in cp_source_files.items():
        if cp_id in ('cp437', 'ibmgraph'):
            continue
        codepage = read_codepage_def(cp_filepath, cp437)
        codepages[cp_id] = [codepage, description]
        if cp_id == 'cp850':
            ## CP858 is derived from CP850 and differs only at 0xD5:
            ## former "dotless i" U+0131 is replaced by "euro symbol" U+20AC
            cp858 = codepage.copy()
            cp858[0xD5 - 128] = 0x20AC
            codepages['cp858'] = [cp858, 'ISO 8859-1']

    return codepages

def main():
    parser = argparse.ArgumentParser(prog='import_cp',
        description='Generates 8-bit codepage to Unicode mappings.')
    parser.add_argument('-i', metavar='FILE', dest='in_filename',
        default='source_urls.json', help='input file name, default: source_urls.json')
    parser.add_argument('-o', metavar='FILE', dest='out_filename',
        default='codepage_tables.js', help='output file name, default: codepage_tables.js')
    args = parser.parse_args()

    cp_source_files = {}
    os.makedirs('download', exist_ok=True)
    with open(args.in_filename) as f_in:
        for cp_id, [url, description] in json.load(f_in).items():
            cp_filepath = f'download/{cp_id}.txt'
            if not os.path.exists(cp_filepath):
                print(f'downloading codepage definition "{cp_id}" from {url}', file=sys.stderr)
                urllib.request.urlretrieve(url, cp_filepath)
            cp_source_files[cp_id] = [cp_filepath, description]

    if 'cp437' not in cp_source_files:
        raise Exception(f'{args.in_filename}: missing required codepage CP437')

    codepages = parse_codepages(cp_source_files)

    print(f'writing codepage mappings to {args.out_filename}', file=sys.stderr)
    with open(args.out_filename, 'w', encoding='utf-8') as f_out:
        print('/*', file=f_out)
        print(f' * NOTE: This file was auto-generated by {os.path.basename(__file__)}.', file=f_out)
        print(' */\n', file=f_out)
        print('export const CODEPAGE_TABLES =\n{', file=f_out)
        for i_cp_id, cp_id in enumerate(sorted(codepages.keys(), key=lambda k: int(k[2:]))):
            [charmap, description] = codepages[cp_id]
            codepoints_str = ''.join([chr(codepoint) for codepoint in charmap])
            codepoints_json = json.dumps(codepoints_str, ensure_ascii=False)
            if i_cp_id > 0:
                print(',', file=f_out)
            print(f'    {cp_id}: {{description: {json.dumps(description)}, charmap: {codepoints_json}}}', file=f_out, end='')
        print('\n};', file=f_out)

if __name__ == '__main__':
    main()
