/* Optional Cloud Function (Firebase Blaze plan).  functions/index.js
   Runs whenever a story document is deleted (Firestore TTL, owner, or admin):
     - deletes the leftover `reactions` and `views` sub-collections
     - deletes the media from Cloudinary (needs your API secret – keep it in Secret Manager)

   TAMAWO · tamawo-53a9d · Cloudinary cloud: x7i7vzvo

   Setup:
     cd functions && npm i firebase-functions firebase-admin cloudinary
     firebase use tamawo-53a9d
     firebase functions:secrets:set CLOUDINARY_API_SECRET
     firebase functions:config:set cloudinary.api_key="YOUR_API_KEY"   # or use another secret
     firebase deploy --only functions
*/
const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;

admin.initializeApp();
const CLOUDINARY_API_SECRET = defineSecret('CLOUDINARY_API_SECRET');

exports.cleanupStory = onDocumentDeleted(
    { document: 'stories/{id}', secrets: [CLOUDINARY_API_SECRET] },
    async (event) => {
        const db = admin.firestore();
        const data = event.data ? event.data.data() : null;

        // 1) reactions + views sub-collections
        await db.recursiveDelete(db.collection('stories').doc(event.params.id));

        // 2) Cloudinary media (TAMAWO account: x7i7vzvo)
        if (!data) return;
        cloudinary.config({
            cloud_name: 'x7i7vzvo',
            api_key: process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY',
            api_secret: CLOUDINARY_API_SECRET.value()
        });
        const ids = Array.isArray(data.mediaPublicIds) && data.mediaPublicIds.length
            ? data.mediaPublicIds
            : (data.mediaPublicId ? [data.mediaPublicId] : []);
        const type = data.mediaType === 'video' ? 'video' : 'image';
        await Promise.allSettled(ids.map(id => cloudinary.uploader.destroy(id, { resource_type: type, invalidate: true })));
    }
);