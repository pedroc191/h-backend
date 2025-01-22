
const mongoose      = require('mongoose');
const bcrypt        = require('bcrypt');

let userSchema = mongoose.Schema({
    marketplace     : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_marketplace' },
    storefront      : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_storefront' },
    role            : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_role' },
    customer        : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'back_customer' },
    agent           : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_user' },
    first_name      : { type: String                        , default: null },
    last_name       : { type: String                        , default: null },
    email           : { type: String                        , default: null },
    password        : { type: String                        , default: null },
    application_type: { type: String                        , default: null },
    change_password : { type: Boolean                       , default: false },
    token_login     : { type: String                        , default: null },
    token_reset     : { type: String                        , default: null },
    
    created_at      : { type: Date                          , default: Date.now },
    updated_at      : { type: Date                          , default: Date.now }, 
    deleted_at      : { type: Date                          , default: null }, 
    deleted         : { type: Boolean                       , default: false },
    status          : { type: String                        , default: 'active' }
});

userSchema.methods.generateHash = function(password) {

    return bcrypt.hashSync( password, bcrypt.genSaltSync(8), null );
};
userSchema.methods.validPassword = function(password) {
    
    return bcrypt.compareSync( password, this.password );
};
userSchema.pre('updateOne', function(next) {
    if( this.getUpdate().$set.password ){

        this.getUpdate().$set.password = bcrypt.hashSync( this.getUpdate().$set.password, bcrypt.genSaltSync(8), null );
    }
    next();
});
userSchema.pre('save', function(next) {
    if( this.password ){

        this.password = bcrypt.hashSync( this.password, bcrypt.genSaltSync(8), null );
    }
    next();
});

module.exports = mongoose.model( 'back_user', userSchema );
