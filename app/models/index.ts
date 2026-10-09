// Keep CommonJS compatibility for existing model modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const userModel = require("./postgres/users.model");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TourModel = require("./postgres/tours.model").default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MemberModel = require("./postgres/members.model").default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AccountsModel = require("./postgres/accounts.model").default;

export const models = {
  user: userModel,
  tour: TourModel,
  member: MemberModel,
  account: AccountsModel,
};

export default models;
// Ensure require() gets the plain object
module.exports = models;
