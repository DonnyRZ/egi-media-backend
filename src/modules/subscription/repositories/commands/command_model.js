const joi = require("joi");

const subscriptionPlanPayload = {
  name: joi.string().trim().min(1).max(100).required(),
  description: joi.string().trim().allow("", null).optional(),
  price: joi.number().positive().precision(2).required(),
  duration_days: joi.number().integer().min(1).required(),
  is_active: joi.boolean().default(true),
};

const createSubscriptionPlanParamType = joi.object(subscriptionPlanPayload);

const updateSubscriptionPlanParamType = joi.object({
  id: joi.string().uuid().required(),
  ...subscriptionPlanPayload,
});

const deactivateSubscriptionPlanParamType = joi.object({
  id: joi.string().uuid().required(),
});

const createUserSubscriptionParamType = joi.object({
  user_id: joi.string().uuid().required(),
  subscription_plan_id: joi.string().uuid().required(),
  payment_reference: joi.string().trim().min(1).max(255).required(),
});

const cancelUserSubscriptionParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
});

module.exports = {
  createSubscriptionPlanParamType,
  updateSubscriptionPlanParamType,
  deactivateSubscriptionPlanParamType,
  createUserSubscriptionParamType,
  cancelUserSubscriptionParamType,
};
