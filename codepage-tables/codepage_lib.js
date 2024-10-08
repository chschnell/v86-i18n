/*
 * codepage_lib.js (JavaScript module)
 */

import { CODEPAGE_TABLES } from './codepage_tables.js';

export class Codepage
{
    // TODO: remove
    static CP_DESCRIPTION = {
        cp437: 'DOS Latin US',
        cp737: 'DOS Greek',
        cp775: 'DOS Baltic Rim',
        cp850: 'DOS Latin 1',
        cp852: 'DOS Latin 2',
        cp855: 'DOS Cyrillic',
        cp857: 'DOS Turkish',
        cp858: 'ISO 8859-1',
        cp860: 'DOS Portuguese',
        cp861: 'DOS Icelandic',
        cp862: 'DOS Hebrew',
        cp863: 'DOS French Canada',
        cp864: 'DOS Arabic',
        cp865: 'DOS Nordic',
        cp866: 'DOS Cyrillic Russian',
        cp869: 'DOS Greek 2',
        cp874: 'DOS Thai',
        cp1250: 'Windows Central/Eastern Europe',
        cp1251: 'Windows Cyrillic',
        cp1252: 'Windows ANSI',
        cp1253: 'Windows Greek',
        cp1254: 'Windows Turkish',
        cp1255: 'Windows Hebrew',
        cp1256: 'Windows Arabic',
        cp1257: 'Windows Baltic',
        cp1258: 'Windows Vietnamese'
    };

    static get_available_codepages()
    {
        const result = {};
        for(const cp_id of Object.keys(CODEPAGE_TABLES))
        {
            if(!this.CP_DESCRIPTION.hasOwnProperty(cp_id))
            {
                throw new Error(`internal error: unknown codepage id ${cp_id}`);
            }
            result[cp_id] = this.CP_DESCRIPTION[cp_id];
        }
        return result;
    }

    constructor(cp_id)
    {
        if(!CODEPAGE_TABLES.hasOwnProperty(cp_id))
        {
            throw new Error(`unknown codepage id ${cp_id}`);
        }
        this.cp_id = cp_id;
        this.charmap = cp_id === 'cp437' ?
            CODEPAGE_TABLES.cp437 :
            CODEPAGE_TABLES.cp437.slice(0, 128) + CODEPAGE_TABLES[cp_id];
    }
}
