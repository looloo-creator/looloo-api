import { Request, Response } from "express";
import Validator from "validatorjs";
import models from "../models";
import Responser from "../response";

type AuthRequest = Request & { user?: { id: string }; body: any };

class MemberController {
  async create(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    const validation = new Validator(req.body, {
      tour_id: "required",
      name: "required",
    });
    if (!validation.passes()) {
      response = Responser.validationfail(validation.errors);
      return res.status(response.statusCode).send(response.data);
    }
    try {
      if (req.body.member_id) {
        await models.member.findOneAndUpdate(
          { _id: req.body.member_id },
          req.body
        );
        response = Responser.custom("R212");
      } else {
        const member = new models.member({
          user_id: req.user?.id,
          status: true,
          ...req.body,
        });
        await member.save();
        response = Responser.custom("R211");
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
      const membersList = await models.member.find({
        user_id: req.user?.id,
        tour_id: req.body.tour_id,
        status: true,
      });
      response = Responser.success(membersList);
    } catch (error) {
      response = Responser.error(error);
    }
    return res.status(response.statusCode).send(response.data);
  }

  async delete(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    const validation = new Validator(req.body, { member_id: "required" });
    if (!validation.passes()) {
      response = Responser.validationfail(validation.errors);
      return res.status(response.statusCode).send(response.data);
    }
    try {
      const member = await models.member.findOne({ _id: req.body.member_id });
      if (member) {
        member.status = false;
        await member.save();
        response = Responser.custom("R213");
      } else {
        response = Responser.custom("R404");
      }
    } catch {
      response = Responser.custom("R404");
    }
    return res.status(response.statusCode).send(response.data);
  }
}

export const memberController = new MemberController();
export default memberController;
