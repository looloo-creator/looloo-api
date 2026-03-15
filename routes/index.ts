import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  res.render("index", { title: "One Pay!" });
});

router.post("/", (_req, res) => {
  res.json({ title: "One Pay" });
});

export default router;
