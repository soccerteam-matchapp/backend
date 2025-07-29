import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    id: string;
    name: string;
    password: string;
    belonging: Types.ObjectId[];  // 동호회/동아리 소속
    myTeams: Types.ObjectId[];    // 내가 만든 팀
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        belonging: { type: [Schema.Types.ObjectId], ref: 'Team', default: [] },
        myTeams: { type: [Schema.Types.ObjectId], ref: 'Team', default: [] },
    },
    { timestamps: true }
);

// 비밀번호 해싱
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;