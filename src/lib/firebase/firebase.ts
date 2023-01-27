import { firestore, credential } from "firebase-admin";
import { initializeApp } from 'firebase-admin/app';
import { Firestore } from "firebase-admin/firestore";
import { writeFileSync } from "fs";

/**
 * Connect to firestore admin sdk.  Expects GOOGLE_APPLICATION_CREDENTIALS to be set as an
 * environment variable containing the path to the admin sdk private key credentials file.
 * 
 * @returns firestore database
 */
export function connectToFirebase() {
    initializeApp({
        credential: credential.applicationDefault()
    })

    return firestore()
}

/**
 * Build a bundle file from a firebase collection
 * 
 * @param db firebase connection
 * @param collectionName firebase collection name
 * @param outputFile output bundle file name
 */
export async function buildBundle(db: Firestore, collectionName: string, outputFile: string) {
    let bundle = db.bundle(collectionName)
    const collectionData = await db.collection(collectionName).get()

    let bundleBuffer = bundle.add(collectionName, collectionData).build()

    let outFileName = outputFile

    writeFileSync(outFileName, bundleBuffer)
} 

/**
 * Insert all provided records into a specific firebase collection  
 * 
 * @param db firebase connection
 * @param data array of items to insert
 * @param collection destination firebase collection name
 */
export async function insertDataIntoCollection(db: Firestore, data: any, collection: string) {
    for (const item of data) {
        await db.collection(collection).add(item)
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            })
    }
}

/**
 * Delete all items from a specific collection in batches
 * 
 * @param db firebase connection
 * @param name name of collection to delete
 * @param limit delete batch size (500 is sdk max)
 * @returns 
 */
export async function deleteAllFromCollection(db: Firestore, name: string, limit = 500) {
    const collectionRef = db.collection(name);
    const query = collectionRef.limit(limit);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    })
}

/**
 * Batch of items to delete from a collection
 * 
 * @param db 
 * @param query 
 * @param resolve 
 * @returns 
 */
async function deleteQueryBatch(db: Firestore, query: firestore.Query, resolve: any) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}
