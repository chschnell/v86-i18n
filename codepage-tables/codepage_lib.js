/*
 * codepage_lib.js (JavaScript module)
 */

import { CODEPAGE_TABLES } from './codepage_tables.js';

export class Codepage
{
    static get_available_codepages()
    {
        const result = {};
        for (const [cp_id, codepage] of Object.entries(CODEPAGE_TABLES)) {
            result[cp_id] = codepage.description;
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
            CODEPAGE_TABLES.cp437.charmap :
            CODEPAGE_TABLES.cp437.charmap.slice(0, 128) + CODEPAGE_TABLES[cp_id].charmap;
    }
}
