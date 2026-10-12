const joi=require('joi');
module.exports={list:joi.object({page:joi.number().integer().min(1).default(1),limit:joi.number().integer().min(1).max(100).default(20),lang:joi.string().valid('id','en','uz').default('id')}),id:joi.string().max(150).required()};
