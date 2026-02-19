import mongoose from 'mongoose';

declare global {
    var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

function getMongoUri() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is missing in web/.env');
    }

    return uri;
}

export async function connectMongo() {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    if (!global.mongooseConnectionPromise) {
        global.mongooseConnectionPromise = mongoose.connect(getMongoUri(), {
            autoIndex: process.env.NODE_ENV !== 'production'
        });
    }

    return global.mongooseConnectionPromise;
}

export { mongoose };
