#!/bin/python

import os, sys, json, urllib, urllib.parse, urllib.request

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

def main():
    source_urls = 'source_urls.json'
    if len(sys.argv) > 2 and sys.argv[1] == '-f':
        source_urls = sys.argv[2]

    ## cp_files: dict(str cp_id => [str cp_filepath, str description])
    cp_files = {}
    cp437_filepath = None
    ibmgraph_filepath = None

    os.makedirs('download', exist_ok=True)
    with open(source_urls) as source_urls:
        for cp_id, [source_url, description] in json.load(source_urls).items():
            url = urllib.parse.urlparse(source_url)
            cp_filepath = f'download/{cp_id}.txt'
            if not os.path.exists(cp_filepath):
                print(f'downloading codepage definition "{cp_id}" from {source_url}', file=sys.stderr)
                urllib.request.urlretrieve(source_url, cp_filepath)
            if cp_id == 'cp437':
                if cp437_filepath:
                    raise Exception(f'{source_urls}: {cp_id} must not be defined more than once')
                cp437_filepath = [cp_filepath, description]
            elif cp_id == 'ibmgraph':
                if ibmgraph_filepath:
                    raise Exception(f'{source_urls}: {cp_id} must not be defined more than once')
                ibmgraph_filepath = cp_filepath
            else:
                cp_files[cp_id] = [cp_filepath, description]

    ## parse codepage CP437 first
    if not cp437_filepath:
        raise Exception(f'{source_urls}: missing required codepage CP437.TXT')
    cp437 = read_codepage_def(cp437_filepath[0])

    ## replace control characters in CP437 with printable characters defined in IBMGRAPH (optional)
    if ibmgraph_filepath:
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

    ## codepages: dict(str cp_id => array codepage[128 or 256 * Uint8])
    codepages = {'cp437': [cp437, cp437_filepath[1]]}
    for cp_id, [cp_filepath, description] in cp_files.items():
        codepage = read_codepage_def(cp_filepath, cp437)
        codepages[cp_id] = [codepage, description]
        if cp_id == 'cp850':
            ## CP858 is derived from CP850 and differs only at 0xD5:
            ## former "dotless i" U+0131 is replaced by "euro symbol" U+20AC
            cp858 = codepage.copy()
            cp858[0xD5 - 128] = 0x20AC
            codepages['cp858'] = [cp858, 'ISO 8859-1']

    ## sorted_cp_ids: array(str cp_id)
    sorted_cp_ids = sorted(codepages.keys(), key=lambda k: int(k[2:]))

    print('/*')
    print(f' * NOTE: This file was auto-generated by {os.path.basename(__file__)}.')
    print(' */\n')
    last_i_cp = len(sorted_cp_ids) - 1
    print('export const CODEPAGE_TABLES =\n{')
    for i_cp, cp_id in enumerate(sorted_cp_ids):
        codepage = codepages[cp_id]
        codepoints_str = ''.join([chr(codepoint) for codepoint in codepage[0]])
        codepoints_json = json.dumps(codepoints_str, ensure_ascii=False)
        print(f'    {cp_id}: {{description: {json.dumps(codepage[1])}, charmap: {codepoints_json}}}',
            end='\n' if i_cp == last_i_cp else ',\n')
    print('};')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
