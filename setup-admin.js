const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

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
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Check if admin exists
    const existing = await Admin.findOne({ username: 'admin_test' });
    if (existing) {
      console.log('ℹ️  Admin exists, updating password...');
      await Admin.updateOne(
        { username: 'admin_test' },
        { password: '12345ab' }
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
        password: '12345ab',
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
