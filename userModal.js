/** @format */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectionDb = new Schema({
	userId: {
		type: Number,
		required: true,
	},
	expoNotificationToken: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('User', connectionDb);
