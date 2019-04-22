import { Schema, model } from 'mongoose';

const ProductSchema = new Schema({
  name: String,
  price: Number,
  stock: Number
});

export default model('Product', ProductSchema);