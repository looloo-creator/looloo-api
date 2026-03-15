// Keep CommonJS compatibility for existing model modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const userModel = require("./mysql/user.model");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TourModel = require("./mongo/tours.model");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MemberModel = require("./mongo/members.model");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AccountsModel = require("./mongo/accounts.model");

export const models = {
  user: userModel,
  tour: TourModel,
  member: MemberModel,
  account: AccountsModel,
};

export default models;
// Ensure require() gets the plain object
module.exports = models;
