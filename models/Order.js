import { Schema, model, Types } from 'mongoose';

const OrderSchema = new Schema({
  order: Array,
  total: Number,
  date: Date,
  client: Types.ObjectId,
  status: String,
  seller: Types.ObjectId
});

export default model('Order', OrderSchema);