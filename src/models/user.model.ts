import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    id: string;
    name: string;
    password: string;
    hasTeams?: Types.ObjectId[];
    myTeams?: Types.ObjectId[];
    refreshToken?: string;
    comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        password: { type: String, required: true },
        hasTeams: [{ type: Types.ObjectId, ref: 'Team' }],   // 옵셔널 배열
        myTeams: [{ type: Types.ObjectId, ref: 'Team' }],   // 옵셔널 배열
        refreshToken: { type: String },                      // 옵셔널
    },
    { timestamps: true }
);

// 내부 해시/검증 함수
async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}
async function verifyPassword(candidate: string, hashed: string) {
    return bcrypt.compare(candidate, hashed);
}

// 저장 직전 해싱
userSchema.pre<IUser>('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await hashPassword(this.password);
    }
    next();
});

// 인스턴스 메서드로 비교
userSchema.methods.comparePassword = function (candidate: string) {
    return verifyPassword(candidate, this.password);
};

export const User: Model<IUser> = mongoose.model('User', userSchema);