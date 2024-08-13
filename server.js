/** @format */

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const app = express();
const User = require('./userModal');
const cors = require('cors');
const { Expo } = require('expo-server-sdk');

let expo = new Expo();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectionString = process.env.MONGO_URI;

mongoose
	.connect(connectionString)
	.then(() => {
		console.log('Connected to MongoDB');
	})
	.catch((err) => {
		console.log('Failed to connect to MongoDB', err);
	});

app.post('/', async (req, res) => {
	const { userId, token } = req.body;
	console.log(userId, token);
	if (!token || !userId) {
		return res.status(400).json({
			data: null,
			error: 'Token and userid are required',
			status: 'errror',
		});
	}
	try {
		const user = await User.findOne({ userId: userId });
		if (user) {
			await User.updateOne(
				{ userId: userId },
				{ expoNotificationToken: token }
			);
		} else {
			const newUser = new User({
				userId: userId,
				expoNotificationToken: token,
			});
			await newUser.save();
		}
		res.status(200).json({
			data: token,
			status: 'success',
			error: null,
		});
	} catch (err) {
		res.status(500).json({
			data: null,
			error: 'Failed to register token',
			status: 'error',
		});
	}
});

app.get('/:id', async (req, res) => {
	const params = req.params.id;
	try {
		const user = await User.findOne({ userId: params });
		if (!user) {
			return res.status(404).json({
				data: null,
				error: 'User not found',
				status: 'error',
			});
		} else {
			res.status(200).json({
				data: user,
				error: null,
				status: 'success',
			});
		}
	} catch (err) {
		res.status(500).json({
			data: null,
			error: 'Failed to get user',
			status: 'error',
		});
	}
});

app.post('/send-notification', async (req, res) => {
	console.log('hello');
	const { to, title, body, data } = req.body;

	if (!to || !title || !body || !data) {
		res.status(400).json({
			data: null,
			error: 'Title, Body, Title, Data fields are required',
			status: 'error',
		});
	}

	if (!Expo.isExpoPushToken(to)) {
		console.error(`Push token ${to} is not a valid Expo push token`);
		return res.status(400).json({
			data: null,
			error: 'Invalid Expo push token',
			status: 'error',
		});
	}

	let messages = [
		{
			to,
			sound: 'default',
			title,
			body,
			data,
		},
	];

	try {
		let chunks = expo.chunkPushNotifications(messages);
		let tickets = [];

		for (let chunk of chunks) {
			try {
				let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
				console.log(ticketChunk);
				tickets.push(...ticketChunk);
			} catch (error) {
				console.error(error);
			}
		}

		res.json(tickets);
	} catch (error) {
		console.error('Error sending push notification:', error);
		res.status(500).send('❌ Failed to send notification');
	}
});

app.listen(process.env.PORT || 3000, () => {
	console.log('Server is running on port 3000');
});
