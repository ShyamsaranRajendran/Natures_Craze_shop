var mongoose = require('mongoose');

// userSchema
var userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    role: {
        type: String
    },
    address: {
        type: String,  // Optional field for the address
        default: ''    // Default value to empty string if not provided
    }
});

var User = module.exports = mongoose.model('User', userSchema);
