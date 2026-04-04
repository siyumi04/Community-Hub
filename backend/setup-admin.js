import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

const adminSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  itNumber: String,
  email: String,
  dashboardName: String,
  username: String,
  password: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'admins' });

const Admin = mongoose.model('Admin', adminSchema);

(async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || 'community_hub';
    await mongoose.connect(process.env.MONGO_URI, { dbName });
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('12345ab', 10);
    
    // Check if admin exists
    const existing = await Admin.findOne({ username: 'admin_test' });
    if (existing) {
      console.log('ℹ️  Admin exists, updating password...');
      await Admin.updateOne(
        { username: 'admin_test' },
        { password: hashedPassword }
      );
    } else {
      console.log('📝 Creating new admin account...');
      const newAdmin = new Admin({
        firstName: 'Test',
        lastName: 'Admin',
        itNumber: 'IT23999999',
        email: 'admin@test.com',
        dashboardName: 'test_admin_hub',
        username: 'admin_test',
        password: hashedPassword,
        createdAt: new Date()
      });
      await newAdmin.save();
    }
    
    console.log('\n✅ Admin Account Ready!\n');
    console.log('📋 Login Credentials:');
    console.log('   Username: admin_test');
    console.log('   Password: 12345ab');
    console.log('   Dashboard: test_admin_hub\n');
    console.log('🔗 Access URL: http://localhost:5176/admin-dashboard/test_admin_hub\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
