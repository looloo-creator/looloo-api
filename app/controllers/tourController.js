const model = require('../models/index');
const Responser = require("../response/index");
const Validator = require('validatorjs');

const create = async (req, res) => {

    let response;
    let validation = new Validator(req.body, {
        plan: 'required',
        plan_start_date: 'required|date',
        plan_end_date: 'required|date'
    });

    if (validation.passes()) {
        try {
            if (req.body.tour_id) {
                try {
                    await model.tour.findOneAndUpdate(
                        { _id: req.body.tour_id },
                        req.body
                    );
                    response = Responser.custom("R209");
                } catch (error) {
                    response = Responser.custom("R404");
                }
            } else {
                // Create a Tour
                const Tour = new model.tour({ user_id: req.user.id, status: true, ...req.body });
                // Save  in the database
                await Tour.save()
                    .then(data => {
                        response = Responser.custom("R208", data);
                    }).catch(error => {
                        response = Responser.error(error);
                    });
            }

        } catch (error) {
            console.log(error)
            response = Responser.error(error);
        }
    } else {
        response = Responser.validationfail(validation.errors)
    }
    return res.status(response.statusCode).send(response.data);
}

const list = async (req, res) => {
    try {
        const toursList = await model.tour.find({ "user_id": req.user.id, status: true });
        response = Responser.success(toursList);
    } catch (error) {
        response = Responser.error(error);
    }
    return res.status(response.statusCode).send(response.data);
}

const deleteTour = async (req, res) => {
    let response;
    let validation = new Validator(req.body, {
        tour_id: 'required'
    });

    if (validation.passes()) {
        try {
            const tour = await model.tour.findOne({ "_id": req.body.tour_id });
            if (tour) {
                tour.status = false;
                tour.save();
                response = Responser.custom("R210");
            } else {
                response = Responser.custom("R404");
            }
        } catch (error) {
            response = Responser.custom("R404");
        }
    } else {
        response = Responser.validationfail(validation.errors)
    }
    return res.status(response.statusCode).send(response.data);
}

module.exports = {
    create: create,
    list: list,
    delete: deleteTour
}
