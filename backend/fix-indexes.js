require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const userIndexes = await mongoose.connection.collection('users').indexes();
  console.log("User Indexes:", userIndexes);
  
  const profileIndexes = await mongoose.connection.collection('studentprofiles').indexes();
  console.log("StudentProfile Indexes:", profileIndexes);
  
  // Try dropping the old unique email index if it exists
  try {
    await mongoose.connection.collection('users').dropIndex('email_1');
    console.log("Dropped email_1 index from users");
  } catch (e) {
    console.log("No email_1 index found, or error:", e.message);
  }

  // Try dropping the old unique parentContact index if it exists
  try {
    await mongoose.connection.collection('studentprofiles').dropIndex('parentContact_1');
    console.log("Dropped parentContact_1 index from studentprofiles");
  } catch (e) {
    console.log("No parentContact_1 index found, or error:", e.message);
  }

  try {
    const users = await mongoose.connection.collection('users').find({ username: { $exists: false } }).toArray();
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const username = u.email ? u.email.split('@')[0] + '_' + i : 'user_' + i;
      await mongoose.connection.collection('users').updateOne({ _id: u._id }, { $set: { username: username } });
    }
    console.log(`Updated ${users.length} users with null/missing usernames.`);
    
    await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true });
    console.log("Created username_1 index on users");
  } catch (e) {
    console.log("Error creating username index:", e.message);
  }

  process.exit(0);
}

fixIndexes();
