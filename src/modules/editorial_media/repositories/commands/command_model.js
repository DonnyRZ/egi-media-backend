const joi=require('joi');
const uuid=joi.string().uuid();
const translations=joi.object({en:joi.object({name:joi.string().trim().min(1).max(150).required(),description:joi.string().max(2000).allow('',null)}),uz:joi.object({name:joi.string().trim().min(1).max(150).required(),description:joi.string().max(2000).allow('',null)})});
const base={name:joi.string().trim().max(150).required(),slug:joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150).required(),description:joi.string().max(2000).allow('',null),translations:translations.default({}),sort_order:joi.number().integer().min(0).max(9999).default(0),is_active:joi.boolean().default(false)};
module.exports={
  slots:joi.object({lead_id:uuid.allow(null).default(null),supporting_ids:joi.array().items(uuid).unique().max(5).default([]),editor_ids:joi.array().items(uuid).unique().max(4).default([])}),
  programs:joi.object({...base,poster_url:joi.string().uri({scheme:['http','https']}).allow('',null)}),
  collections:joi.object({...base,format:joi.string().valid('horizontal','short').required(),video_ids:joi.array().items(uuid).unique().max(100).default([])}),
  hero:joi.object({hero_video_id:uuid.allow(null).required()})
};
