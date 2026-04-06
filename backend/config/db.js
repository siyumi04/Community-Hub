import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const expectedDbName = 'community_hub';
        const dbName = String(process.env.MONGO_DB_NAME || expectedDbName).trim() || expectedDbName;
        await mongoose.connect(process.env.MONGO_URI, { dbName });
        const activeDbName = mongoose.connection?.db?.databaseName || '(unknown)';
        console.log(`Database Connected Successfully! ✅ Active DB: ${activeDbName}`);

        if (activeDbName !== expectedDbName) {
            throw new Error(`Unsafe database selected: ${activeDbName}. Expected: ${expectedDbName}`);
        }

        // Drop ALL non-_id_ indexes from clubmembers and communities
        // to clear stale unique indexes that block multi-community joins
        for (const colName of ['clubmembers', 'communities']) {
            try {
                const col = mongoose.connection.db.collection(colName);
                const indexes = await col.indexes();
                for (const idx of indexes) {
                    if (idx.name === '_id_') continue;
                    console.log(`⚠️  Dropping index "${idx.name}" from ${colName}`);
                    await col.dropIndex(idx.name);
                }
            } catch (err) {
                // Collection may not exist yet — that's fine
                console.log(`ℹ️  Index cleanup for ${colName}: ${err.message}`);
            }
        }
    } catch (error) {
        console.error(`Error: ${error.message} ❌`);
        process.exit(1);
    }
};

export default connectDB;
