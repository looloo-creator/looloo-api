import { Request, Response } from "express";

class NotesController {
  // Placeholder: currently returns validation error if content missing.
  // Can be expanded with real persistence later.
  create(req: Request, res: Response): Response {
    if (!req.body.content) {
      return res.status(400).send({ message: "Note content can not be empty" });
    }
    return res.status(200).send({ message: "Note saved (stub)" });
  }
}

export const notesController = new NotesController();
export default notesController;
