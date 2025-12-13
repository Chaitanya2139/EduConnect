const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const updateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all users without roles
    const usersWithoutRoles = await User.find({ 
      $or: [{ role: { $exists: false } }, { role: null }, { role: '' }] 
    });

    console.log(`Found ${usersWithoutRoles.length} users without roles\n`);

    if (usersWithoutRoles.length === 0) {
      console.log('All users already have roles!');
      process.exit(0);
    }

    // Display users and let you assign roles
    for (let i = 0; i < usersWithoutRoles.length; i++) {
      const user = usersWithoutRoles[i];
      console.log(`User ${i + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Current Role: ${user.role || 'none'}\n`);
    }

    console.log('\nTo assign roles, run this with arguments:');
    console.log('node updateUserRoles.js <email> <role>');
    console.log('Example: node updateUserRoles.js user@email.com instructor');
    console.log('\nValid roles: student, instructor, teaching-assistant');
    console.log('\nOr to set all users without roles to "student":');
    console.log('node updateUserRoles.js --all-student\n');

    // Handle command line arguments
    const args = process.argv.slice(2);
    
    if (args[0] === '--all-student') {
      const result = await User.updateMany(
        { $or: [{ role: { $exists: false } }, { role: null }, { role: '' }] },
        { $set: { role: 'student' } }
      );
      console.log(`✅ Updated ${result.modifiedCount} users to "student" role`);
    } else if (args.length === 2) {
      const [email, role] = args;
      const validRoles = ['student', 'instructor', 'teaching-assistant'];
      
      if (!validRoles.includes(role)) {
        console.log(`❌ Invalid role: ${role}`);
        console.log(`Valid roles: ${validRoles.join(', ')}`);
        process.exit(1);
      }

      const user = await User.findOneAndUpdate(
        { email },
        { $set: { role } },
        { new: true }
      );

      if (user) {
        console.log(`✅ Updated ${user.username} (${user.email}) to role: ${role}`);
      } else {
        console.log(`❌ User not found with email: ${email}`);
      }
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

updateUsers();
