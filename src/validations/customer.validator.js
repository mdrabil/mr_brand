import Joi from "joi";
import mongoose from "mongoose";

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};


export const customerValidator = Joi.object({
  name: Joi.string().min(2).required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).required(),
    guestCart: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().custom(objectId).required(),
        variantId: Joi.string().custom(objectId).required(),
        qty: Joi.number().integer().min(1).required(),
      })
    )
    .optional()
    .default([]),

});