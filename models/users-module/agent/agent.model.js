const mongoose = require('mongoose');

let agentSchema = mongoose.Schema({
    name            : { type: String,   default: null },
    email           : { type: String,   default: null },
    photo           : { type: String,   default: null },
    tag             : { type: String,   default: null },
    targets         : { type: Object,   default: [] },
    slackUser       : { type: Object,   default: null },
    agentSupportId  : { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_user' },
    store           : { type: String,   default: "Shop" },
    agentSupports   : { type: [{
        agent_id: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'agent_user' },
        notifications: { type: Boolean, default: true }
    }], default: [] },
    
    created_at      : { type: Date,     default: Date.now },
    updated_at      : { type: Date,     default: Date.now }, 
    deleted_at      : { type: Date,     default: null }, 
    deleted         : { type: Boolean,  default: false },
    status          : { type: String,   default: 'active' }
});
module.exports = mongoose.model( 'agent_user', agentSchema );