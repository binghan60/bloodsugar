import mongoose from 'mongoose';

const bloodSugarCurveSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Animal',
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
        },
        records: [
            {
                time: {
                    type: String,
                    required: true,
                },
                value: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true }
);

// pre('save') 每次執行save的時候都會執行裡面的程式碼
bloodSugarCurveSchema.pre('save', function (next) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    // 驗證 time 是不是24小時格式
    for (const record of this.records) {
        if (!timeRegex.test(record.time)) {
            const error = new Error(`Invalid time format: ${record.time}. Expected HH:mm.`);
            return next(error);
        }
    }
    this.records.sort((a, b) => a.time.localeCompare(b.time));
    next();
});
const BloodSugarCurve = mongoose.model('BloodSugarCurve', bloodSugarCurveSchema);

export default BloodSugarCurve;
