import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import models from "../models";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Responser = require("../response/index");
import Validator from "validatorjs";

type AuthRequest = Request & {
  user?: { id: string };
  file?: Express.Multer.File;
  body: any;
};

const uploadMiddleware = multer({ dest: "/looloo/uploads/" }).single("file");

class AccountController {
  async create(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    const validation = new Validator(req.body, {
      tour_id: "required",
      type: "required",
      date: "required",
      amount: "required",
      reason: "required",
      members: "required",
    });

    if (!validation.passes()) {
      response = Responser.validationfail(validation.errors);
      return res.status(response.statusCode).send(response.data);
    }

    try {
      if (req.body.account_id) {
        await this.updateExisting(req);
        const account = await models.account.findOne({
          _id: req.body.account_id,
        });
        response = Responser.custom("R215", account);
      } else {
        const account = new models.account({
          user_id: req.user?.id,
          status: true,
          ...req.body,
        });
        await account.save();
        response = Responser.custom("R214", account);
      }
    } catch (error) {
      response = Responser.error(error);
    }

    return res.status(response.statusCode).send(response.data);
  }

  async list(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    const validation = new Validator(req.body, { tour_id: "required" });
    if (!validation.passes()) {
      response = Responser.validationfail(validation.errors);
      return res.status(response.statusCode).send(response.data);
    }

    try {
      const accountsList = await models.account
        .find({
          user_id: req.user?.id,
          tour_id: req.body.tour_id,
          status: true,
        })
        .sort({ date: 1, type: 1 });
      response = Responser.success(accountsList);
    } catch (error) {
      response = Responser.error(error);
    }

    return res.status(response.statusCode).send(response.data);
  }

  async delete(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    const validation = new Validator(req.body, { account_id: "required" });
    if (!validation.passes()) {
      response = Responser.validationfail(validation.errors);
      return res.status(response.statusCode).send(response.data);
    }

    try {
      const account = await models.account.findOne({ _id: req.body.account_id });
      if (account) {
        account.status = false;
        await account.save();
        response = Responser.custom("R216");
      } else {
        response = Responser.custom("R404");
      }
    } catch {
      response = Responser.custom("R404");
    }

    return res.status(response.statusCode).send(response.data);
  }

  upload = (req: AuthRequest, res: Response): void => {
    uploadMiddleware(req, res, (err?: any) => {
      if (err instanceof multer.MulterError) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (err) {
        res.status(500).json({ error: "Unknown error" });
        return;
      }
      if (req.file) {
        req.body.file = req.file.filename;
        req.body.fileName = req.file.originalname;
      }
      void this.create(req, res);
    });
  };

  preview = (req: Request, res: Response): Response | void => {
    const filePath = "/looloo/uploads/" + req.params.filename;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    return res.sendFile(filePath);
  };

  private async updateExisting(req: AuthRequest) {
    if (req.body.file || req.body.fileremoved === "1") {
      const account = await models.account.findOne({ _id: req.body.account_id });
      if (account?.file) {
        fs.unlink(`/looloo/uploads/${account.file}`, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        });
      }
      if (req.body.fileremoved === "1") {
        req.body.file = "";
        req.body.fileName = "";
      }
    }
    await models.account.findOneAndUpdate({ _id: req.body.account_id }, req.body);
  }
}

export const accountController = new AccountController();
export default accountController;
