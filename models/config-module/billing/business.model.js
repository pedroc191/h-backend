const mongoose = require('mongoose');

const businessSchema = mongoose.Schema({
    name            : { type: String    , default: null, required: true },
    type            : { type: String    , default: null, enum: { values: ['main', 'custom'], }, default: 'custom' },
    invoice_prefix  : { type: String    , default: null },
    invoice_offset  : { type: Number    , default: null },
    ein             : { type: String    , default: null },
    address         : { type: String    , default: null },
    city            : { type: String    , default: null },
    zipcode         : { type: String    , default: null },
    email           : { type: String    , default: null },
    phone           : { type: String    , default: null },
    
    created_by      : { type: String    , default: null },
    created_at      : { type: Date      , default: Date.now },
    updated_at      : { type: Date      , default: Date.now }, 
    deleted_at      : { type: Date      , default: null }, 
    deleted         : { type: Boolean   , default: false },
    status          : { type: String    , default: 'active' }
});

module.exports = mongoose.model('billing_business', businessSchema);