// this file contains all the validation functions that validated by joi
const wrapper = require("./wrapper");
const { BadRequestError } = require("../errors");

const isValidPayload = (payload, constraint) => {
  const { value, error } = constraint.validate(payload);
  if (error) {
    const message = error.details[0].message.replace(/"/g, "");
    return wrapper.error(new BadRequestError(message));
  }
  return wrapper.data(value, "success", 200);
};

const isValidPhoneNumber = (phoneNumber) => {
  let regex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s./0-9]*$/;
  if (regex.test(phoneNumber)) return true;

  return false;
};

module.exports = {
  isValidPayload,
  isValidPhoneNumber,
};
