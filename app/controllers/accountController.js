const model = require('../models/index');
const Responser = require("../response/index");
const Validator = require('validatorjs');
const multer = require("multer");
const fs = require('fs');

const multerupload = multer({ dest: '/onepay/uploads/' }).single('file');
const create = async (req, res) => {
    let response;
    let validation = new Validator(req.body, {
        tour_id: "required",
        type: "required",
        date: "required",
        amount: "required",
        reason: "required",
        members: "required"
    });
    if (validation.passes()) {
        try {
            if (req.body.account_id) {
                try {
                    const unset = {};
                    if(req.body.file || req.body.fileremoved === "1"){
                        const Account = await model.account.findOne({ _id: req.body.account_id });
                        if(Account.file){
                            fs.unlink(`/onepay/uploads/${Account.file}`, (err) => {
                                if (err) {
                                    console.error('❌ Error deleting file:', err);
                                } else {
                                    console.log('✅ File deleted successfully');
                                }
                            });
                        }
                        if(req.body.fileremoved === "1"){
                            req.body.file = ""; 
                            req.body.fileName = ""; 
                        }
                    }
                    await model.account.findOneAndUpdate(
                        { _id: req.body.account_id },
                        req.body
                    );
                    const Account = await model.account.findOne({ _id: req.body.account_id });
                    response = Responser.custom("R215", Account);
                } catch (error) {
                    response = Responser.custom("R404");
                }
            } else {
                // Create a Account
                const Account = new model.account({ user_id: req.user.id, status: true, ...req.body });
                // Save  in the database
                await Account.save()
                    .then(data => {
                        response = Responser.custom("R214", Account);
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
            const accountsList = await model.account.find({ "user_id": req.user.id, "tour_id": req.body.tour_id, status: true }).sort({ date: 1, type: 1 });
            response = Responser.success(accountsList);
        } catch (error) {
            console.log(error)
            response = Responser.error(error);
        }
    } else {
        response = Responser.validationfail(validation.errors)
    }
    return res.status(response.statusCode).send(response.data);
}

const deleteAccount = async (req, res) => {
    let response;
    let validation = new Validator(req.body, {
        account_id: 'required'
    });

    if (validation.passes()) {
        try {
            const account = await model.account.findOne({ "_id": req.body.account_id });
            if (account) {
                account.status = false;
                account.save();
                response = Responser.custom("R216");
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


const upload = async (req, res) => {
    multerupload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Unknown error' });
    }
    if(req.file){
        req.body.file = req.file.filename;
        req.body.fileName = req.file.originalname;
    }
    create(req,res);
    console.log('Uploaded file:', req.file);
  });
}

const preview = async (req, res) => {
  const filePath = "/onepay/uploads/"+ req.params.filename;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  return res.sendFile(filePath);
};

module.exports = {
    create: create,
    list: list,
    delete: deleteAccount,
    upload: upload,
    preview: preview
}
