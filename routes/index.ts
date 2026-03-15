import express from "express";

const router = express.Router();

router.get("/", (_req, res) => {
  res.render("index", { title: "Looloo!" });
});

router.post("/", (_req, res) => {
  res.json({ title: "Looloo" });
});

export default router;
