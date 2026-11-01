import type { NextFunction, Request, Response } from "express";

const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    if (res.headersSent) {
        next(err);
        return;
    }

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};

export default errorHandler;