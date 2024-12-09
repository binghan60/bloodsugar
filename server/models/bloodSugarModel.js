﻿import mongoose from 'mongoose';

const bloodSugarSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
		date: {
			type: Date,
			required: true,
			unique: true,
		},
		morning: {
			bloodSugar: {
				type: Number,
			},
			insulin: {
				type: Number,
			},
		},
		evening: {
			bloodSugar: {
				type: Number,
			},
			insulin: {
				type: Number,
			},
		},
		notes: {
			type: String,
			default: '',
		},
	},
	{ timestamps: true }
);

const BloodSugarSchema = mongoose.model('Record', bloodSugarSchema);
export default BloodSugarSchema;