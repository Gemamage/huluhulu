import express from "express";
import commentsRouter from "./comments";
import messagesRouter from "./messages";
import reviewsRouter from "./reviews";
import reportsRouter from "./reports";

const router = express.Router();

// 掛載子路由
router.use("/comments", commentsRouter);
router.use("/messages", messagesRouter);
router.use("/reviews", reviewsRouter);
router.use("/reports", reportsRouter);

export default router;
