import { Request, Response } from "express";
import Validator from "validatorjs";
import models from "../models";
import Responser from "../response";

type AuthRequest = Request & { user?: { id: string }; body: any };

class TourController {
  async create(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    if (!req.user?.id) {
      response = Responser.custom("R401");
      return res.status(response.statusCode).send(response.data);
    }
    const validation = new Validator(req.body, {
      plan: "required",
      plan_start_date: "required|date",
      plan_end_date: "required|date",
    });
    if (!validation.passes()) {
      response = Responser.validationfail(validation.errors);
      return res.status(response.statusCode).send(response.data);
    }
    try {
      if (req.body.tour_id) {
        await models.tour.findOneAndUpdate({ _id: req.body.tour_id }, req.body);
        response = Responser.custom("R209");
      } else {
        const tour = new models.tour({
          user_id: req.user?.id,
          status: true,
          ...req.body,
        });
        const data = await tour.save();
        response = Responser.custom("R208", data);
      }
    } catch (error) {
      response = Responser.error(error);
    }
    return res.status(response.statusCode).send(response.data);
  }

  async list(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    try {
      if (!req.user?.id) {
        response = Responser.custom("R401");
        return res.status(response.statusCode).send(response.data);
      }
      const toursList = await models.tour.find({ user_id: req.user.id, status: true });
      response = Responser.success(toursList);
    } catch (error) {
      response = Responser.error(error);
    }
    return res.status(response.statusCode).send(response.data);
  }

  async delete(req: AuthRequest, res: Response): Promise<Response> {
    let response;
    if (!req.user?.id) {
      response = Responser.custom("R401");
      return res.status(response.statusCode).send(response.data);
    }
    const validation = new Validator(req.body, { tour_id: "required" });
    if (!validation.passes()) {
      response = Responser.validationfail(validation.errors);
      return res.status(response.statusCode).send(response.data);
    }
    try {
      const tour = await models.tour.findOne({ _id: req.body.tour_id });
      if (tour) {
        tour.status = false;
        await tour.save();
        response = Responser.custom("R210");
      } else {
        response = Responser.custom("R404");
      }
    } catch (error) {
      response = Responser.custom("R404");
    }
    return res.status(response.statusCode).send(response.data);
  }
}

export const tourController = new TourController();
export default tourController;
