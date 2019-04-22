import { Schema, model, Types } from 'mongoose';

const ClientSchema = new Schema({
  name: String,
  lastname: String,
  company: String,
  emails: Array,
  age: Number,
  type: String,
  seller: Types.ObjectId
});

export default model('Client', ClientSchema);