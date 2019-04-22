import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost/clients', {
  useNewUrlParser: true
})
  .then(() => console.log('Database is connected'))
  .catch(err => console.error(err));