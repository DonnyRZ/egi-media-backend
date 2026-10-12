const queries=require('../repositories/queries/query_handler');
const commands=require('../repositories/commands/command_handler');
const schemas=require('../repositories/commands/command_model');
const models=require('../repositories/queries/query_model');
const validator=require('../../../helpers/utils/validator');
const {sendResponse,paginationResponse}=require('../../../helpers/utils/response');
const wrapper=require('../../../helpers/utils/wrapper');
const {BadRequestError}=require('../../../helpers/errors');
const actor=req=>({actor_id:req.userMeta?.id,ip_address:req.headers['x-forwarded-for']||req.socket?.remoteAddress,user_agent:req.headers['user-agent']});
const validId=value=>models.id.validate(value).error == null;
const list=(kind,privateRead=false)=>async(req,res)=>{
  const p=validator.isValidPayload(req.query,models.list);
  if(p.err)return sendResponse(p,res);
  return paginationResponse(await queries.list(kind,{...p.data,privateRead}),res);
};
const one=(kind,privateRead=false)=>async(req,res)=>{
  if(!validId(req.params.id))return sendResponse(wrapper.error(new BadRequestError('Invalid identifier')),res);
  return sendResponse(await queries.one(kind,req.params.id,{lang:['en','uz'].includes(req.query.lang)?req.query.lang:'id',privateRead}),res);
};
const save=kind=>async(req,res)=>{
  if(req.params.id&&!/^[a-f0-9-]{36}$/i.test(req.params.id))return sendResponse(wrapper.error(new BadRequestError('Invalid identifier')),res);
  const p=validator.isValidPayload(req.body,schemas[kind]);
  if(p.err)return sendResponse(p,res);
  return sendResponse(await commands.save(kind,req.params.id,{...p.data,...actor(req)}),res);
};
const category=async(req,res)=>{
  if(!validId(req.params.id))return sendResponse(wrapper.error(new BadRequestError('Invalid category')),res);
  return sendResponse(await queries.category(req.params.id,['en','uz'].includes(req.query.lang)?req.query.lang:'id'),res);
};
const slots=async(req,res)=>{
  const p=validator.isValidPayload(req.body,schemas.slots);
  if(p.err)return sendResponse(p,res);
  return sendResponse(await commands.slots(req.params.id,{...p.data,...actor(req)}),res);
};
const hero=async(req,res)=>sendResponse(await queries.hero(),res);
const saveHero=async(req,res)=>{
  const p=validator.isValidPayload(req.body,schemas.hero);
  if(p.err)return sendResponse(p,res);
  return sendResponse(await commands.hero({...p.data,...actor(req)}),res);
};
module.exports={list,one,save,category,slots,hero,saveHero};

