import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // 名字（必填）
        birthday: { type: Date }, // 生日（使用 Date 類型）
        bloodType: {
            type: String,
            enum: ['A', 'B', 'AB', 'O', 'Unknown'], // 限制血型類型
            default: 'Unknown',
        },
        variety: { type: String }, // 品種
        type: {
            type: String,
            enum: ['dog', 'cat', 'Other'], // 限制動物類型
            required: true,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Unknown'], // 限制性別
            default: 'Unknown',
        },
        ligation: { type: Boolean, default: false }, // 是否結紮
    },
    {
        timestamps: true, // 自動生成 createdAt 和 updatedAt
    }
);

const Animal = mongoose.model('Animal', animalSchema);

export default Animal;
