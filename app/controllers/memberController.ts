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
      const tour = await models.tour.findOne({ where: { id: req.body.tour_id, user_id: req.user?.id, status: true } });
      if (!tour) return res.status(404).send(Responser.custom("R404").data);
      if (req.body.member_id) {
        const { user_id: _ignoredUserId, member_id: _ignoredMemberId, ...updates } = req.body;
        const [updated] = await models.member.update(updates, { where: { id: req.body.member_id, user_id: req.user?.id } });
        if (!updated) return res.status(404).send(Responser.custom("R404").data);
        response = Responser.custom("R212");
      } else {
        const member = await models.member.create({
          ...req.body,
          user_id: req.user?.id,
          status: true,
        });
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
      const membersList = await models.member.findAll({ where: { user_id: req.user?.id, tour_id: req.body.tour_id, status: true } });
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
      const member = await models.member.findOne({ where: { id: req.body.member_id, user_id: req.user?.id } });
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
