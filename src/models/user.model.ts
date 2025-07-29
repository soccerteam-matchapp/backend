import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IUser extends Document {
    id: string;
    name: string;
    password: string;
    belonging: Types.ObjectId[];
    myTeams: Types.ObjectId[];
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

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);