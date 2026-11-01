import type { ObjectId } from "mongodb";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
    _id?: ObjectId;
    studioId: ObjectId;
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    createdAt: Date;
}