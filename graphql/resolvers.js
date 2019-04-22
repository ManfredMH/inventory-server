import { Types } from 'mongoose';
import { rejects } from 'assert';
import Client from '../models/Client';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const createToken = (userLogin, secrect, expiresIn) => {
  const { user } = userLogin;
  return jwt.sign({user}, secrect, {expiresIn});
}

export const resolvers = {
  Query: {
    getClients: (root, { limit, offset, seller }) => {
      let filter;
      if (seller) {
        filter = { 'seller': new Types.ObjectId(seller) };
      }
      return Client.find(filter).limit(limit).skip(offset);
    },
    getClient: (root, { id }) => {
      return new Promise((resolve, obj) => {
        Client.findById(id, (err, client) => {
          if (err) rejects(err);
          else resolve(client);
        });
      });
    },
    totalClients: (root, { seller }) => {
      let filter;
      if (seller) {
        filter = { 'seller': new Types.ObjectId(seller) };
      }
      return new Promise((resolve, obj) => {
        Client.countDocuments(filter, (err, count) => {
          if (err) rejects(err);
          else resolve(count);
        });
      });
    },
    getProducts: (root, { limit, offset, stock }) => {
      let filter;
      if (stock) {
        filter = { stock: { $gt: 0 } };
      }
      return Product.find(filter).limit(limit).skip(offset);
    },
    getProduct: (root, { id }) => {
      return new Promise((resolse, obj) => {
        Product.findById(id, (err, product) => {
          if (err) rejects(err);
          else resolse(product);
        });
      });
    },
    totalProducts: (root) => {
      return new Promise((resolve, obj) => {
        Product.countDocuments({}, (err, count) => {
          if (err) rejects(err);
          else resolve(count);
        });
      });
    },
    getOrders: (root, { client }) => {
      return new Promise((resolve, obj) => {
        Order.find({ client: client }, (err, order) => {
          if (err) rejects(err);
          else resolve(order);
        });
      });
    },
    topClients: (root) => {
      return new Promise((resolve, obj) => {
        Order.aggregate([
          {
            $match: { status: "COMPLETED" }
          },
          {
            $group: {
              _id: "$client",
              total: { $sum: "$total" }
            }
          },
          {
            $lookup: { from: "clients", localField: "_id", foreignField: "_id", as: "client" }
          },
          {
            $sort: { total: -1 }
          },
          {
            $limit: 10
          }
        ], (err, result) => {
          if (err) rejects(err);
          else resolve(result);
        });
      });
    },
    getUser: (root, args, { currentUser }) => {
      if (!currentUser) {
        return null;
      }
      const user = User.findOne({ user: currentUser.user });
      return user;
    },
    topSellers: (root) => {
      return new Promise((resolve, obj) => {
        Order.aggregate([
          {
            $match: { status: "COMPLETED" }
          },
          {
            $group: {
              _id: "$seller",
              total: { $sum: "$total" }
            }
          },
          {
            $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "seller" }
          },
          {
            $sort: { total: -1 }
          },
          {
            $limit: 10
          }
        ], (err, result) => {
          if (err) rejects(err);
          else resolve(result);
        });
      });
    }
  },
  Mutation: {
    createClient: (root, { input }) => {
      const newClient = new Client({
        name: input.name,
        lastname: input.lastname,
        company: input.company,
        emails: input.emails,
        age: input.age,
        type: input.type,
        orders: input.orders,
        seller: input.seller
      });
      newClient.id = newClient._id;
      return new Promise((resolve, obj) => {
        newClient.save((err) => {
          if (err) rejects(err);
          else resolve(newClient);
        });
      });
    },
    updateClient: (root, { input }) => {
      return new Promise((resolve, obj) => {
        Client.findOneAndUpdate({ _id: input.id }, input, { new: true }, (err, client) => {
          if (err) rejects(err);
          else resolve(client);
        });
      });
    },
    deleteClient: (root, { id }) => {
      return new Promise((resolve, obj) => {
        Client.findOneAndDelete({ _id: id }, (err) => {
          if (err) rejects(err);
          else resolve("Client Deleted Successfully");
        });
      });
    },
    createProduct: (root, { input }) => {
      const newProduct = new Product({
        name: input.name,
        price: input.price,
        stock: input.stock
      });
      newProduct.id = newProduct._id;
      return new Promise((resolve, obj) => {
        newProduct.save((err) => {
          if (err) rejects(err);
          else resolve(newProduct);
        });
      });
    },
    updateProduct: (root, { input }) => {
      return new Promise((resolve, obj) => {
        Product.findOneAndUpdate({ _id: input.id }, input, { new: true }, (err, product) => {
          if (err) rejects(err);
          else resolve(product);
        });
      });
    },
    deleteProduct: (root, { id }) => {
      return new Promise((resolve, product) => {
        Product.findOneAndDelete({ _id: id }, (err) => {
          if (err) rejects(err);
          else resolve('Product Deleted Successfully');
        });
      });
    },
    addOrder: (root, { input }) => {
      const newOrder = Order({
        order: input.order,
        total: input.total,
        date: new Date(),
        client: input.client,
        status: "PENDING",
        seller: input.seller
      });
      newOrder.id = newOrder._id;
      return new Promise((resolve, obj) => {
        newOrder.save((err) => {
          if (err) rejects(err);
          else resolve(newOrder);
        });
      });
    },
    updateStatus: (root, { input }) => {
      return new Promise((resolve, obj) => {
        const { status } = input;
        let operator;
        if (status === 'COMPLETED') {
          operator = '-';
        } else if (status === 'CANCELED') {
          operator = '+';
        } else {

        }
        input.order.forEach(order => {
          Product.updateOne({ _id: order.id }, {
            "$inc": {
              "stock": `${operator}${order.quantity}`
            }
          }, function (err) {
            if (err) return new Error(err);
          });
        });
        Order.findOneAndUpdate({ _id: input.id }, input, { new: true }, (err) => {
          if (err) rejects(err);
          else resolve('Status updated Successfully');
        });
      });
    },
    createUser: async (root, { user, name, password, rol }) => {
      const existenUser = await User.findOne({ user });
      if (existenUser) {
        throw new Error('User already exist');
      }
      const newUser = await new User({
        user,
        name,
        password,
        rol
      });
      newUser.save();
      return 'User Created Successfully';
    },
    authenticatedUser: async (root, { user, password }) => {
      const username = await User.findOne({ user });
      if (!username) {
        throw new Error('User not Found');
      }
      const correctPassword = await bcrypt.compare(password, username.password);
      if (!correctPassword) {
        throw new Error('Incorrect Password');
      } 
      return {
        token: createToken(username, process.env.SECRECT, '1hr')
      };
    }
  }
}