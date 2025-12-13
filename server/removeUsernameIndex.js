const mongoose = require('mongoose');
require('dotenv').config();

const removeIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Drop the username unique index
    await mongoose.connection.db.collection('users').dropIndex('username_1');
    
    console.log('✅ Successfully removed username unique index');
    console.log('Users can now have duplicate usernames (only emails must be unique)');
    
    mongoose.disconnect();
  } catch (error) {
    if (error.message.includes('index not found')) {
      console.log('✅ Index already removed or does not exist');
    } else {
      console.error('❌ Error:', error.message);
    }
    mongoose.disconnect();
  }
};

removeIndex();
