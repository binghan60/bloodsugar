import mongoose from 'mongoose';

const weightSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true, index: true },
        date: { type: Date, required: true },
        weight: { type: Number, required: true },
    },
    { timestamps: true }
);
const Weight = mongoose.model('Weight', weightSchema);

export default Weight;
