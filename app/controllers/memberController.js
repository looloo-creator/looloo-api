const model = require('../models/index');
const Responser = require("../response/index");
const Validator = require('validatorjs');

const create = async (req, res) => {

    let response;
    let validation = new Validator(req.body, {
        tour_id: 'required',
        name: 'required',
    });

    if (validation.passes()) {
        try {
            if (req.body.member_id) {
                try {
                    await model.member.findOneAndUpdate(
                        { _id: req.body.member_id },
                        req.body
                    );
                    response = Responser.custom("R212");
                } catch (error) {
                    response = Responser.custom("R404");
                }
            } else {
                // Create a Member
                const Member = new model.member({ user_id: req.user.id, status: true, ...req.body });
                // Save  in the database
                await Member.save()
                    .then(data => {
                        response = Responser.custom("R211");
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
    let response;
    let validation = new Validator(req.body, {
        tour_id: 'required'
    });

    if (validation.passes()) {
        try {
            const membersList = await model.member.find({ "user_id": req.user.id, "tour_id": req.body.tour_id, status: true });
            response = Responser.success(membersList);
        } catch (error) {
            console.log(error)
            response = Responser.error(error);
        }
    } else {
        response = Responser.validationfail(validation.errors)
    }
    return res.status(response.statusCode).send(response.data);
}


const deleteMember = async (req, res) => {
    let response;
    let validation = new Validator(req.body, {
        member_id: 'required'
    });

    if (validation.passes()) {
        try {
            const member = await model.member.findOne({ "_id": req.body.member_id });
            if (member) {
                member.status = false;
                member.save();
                response = Responser.custom("R213");
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
    delete: deleteMember
}
