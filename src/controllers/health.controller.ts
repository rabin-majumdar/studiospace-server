import type { Request, Response } from "express";

const getHealth = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: "StudioSpace API is healthy!",
    });
};

export default getHealth;