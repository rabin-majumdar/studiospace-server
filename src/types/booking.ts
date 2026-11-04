import type { ObjectId } from "mongodb";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

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