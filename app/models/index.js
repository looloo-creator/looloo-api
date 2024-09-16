const userModel = require("./mysql/user.model");
const TourModel = require('./mongo/tours.model');
const MemberModel = require('./mongo/members.model');
const AccountsModel = require("./mongo/accounts.model");
const model = {};
/* Mysql - Start */
model.user = userModel;
/* Mysql - End */

/* Mongo - Start */
model.tour = TourModel;
model.member = MemberModel;
model.account = AccountsModel;
/* Mongo - End */

module.exports = model;