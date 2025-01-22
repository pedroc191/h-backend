const mongoose  = require('mongoose');

let countrySchema = mongoose.Schema({
    name        : { type: String    , default: null },
    iso_code_2  : { type: String    , default: null },
    iso_code_3  : { type: String    , default: null },
    states      : { type: [{
        name        : { type: String    , default: null },
        iso_code    : { type: String    , default: null },
        zip_codes   : [{ type: String   , default: null }],
    }], default: [] },
    region      : { type: String    , default: null },
    subregion   : { type: String    , default: null },
    continents  : [{ type: String   , default: null }],
    phone_codes : [{ type: String   , default: null }],
    flag        : { type: String    , default: null },
    currencies  : { type: [{
        name    : { type: String    , default: null },
        code    : { type: String    , default: null },
        symbol  : { type: String    , default: null },
    }], default: [] },
    languages   : { type: [{
        name        : { type: String    , default: null },
        iso_code_1  : { type: String    , default: null },
        iso_code_2  : { type: String    , default: null },
        nativeName  : { type: String    , default: null },
    }], default: [] },
    time_zones  : [{ type: String   , default: null }],

    created_at  : { type: Date      , default: Date.now }, 
    updated_at  : { type: Date      , default: Date.now }, 
    deleted_at  : { type: Date      , default: null }, 
    deleted     : { type: Boolean   , default: false },
    status      : { type: String    , default: 'active' }
});

module.exports = mongoose.model( 'back_country', countrySchema );
