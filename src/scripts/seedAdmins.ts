/**
 * seedAdmins.ts
 *
 * One-time script to populate the Firestore `admins` collection from the
 * list of admin UIDs you supply below.
 *
 * HOW TO USE:
 *  1. Log in to your app as one of your admin accounts.
 *  2. Open the browser console and run the helper below, OR
 *     paste the UIDs manually into the Firebase console:
 *
 *     Firestore → admins collection → New document
 *       Document ID = <user UID>
 *       (no fields needed — presence of the document is sufficient)
 *
 *  Alternatively, run this file with ts-node (needs firebase-admin):
 *    npx ts-node src/scripts/seedAdmins.ts
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FINDING A USER'S UID:
 *   Firebase Console → Authentication → Users → copy the UID column.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

/** Paste the Firebase Auth UIDs of every admin user here. */
const ADMIN_UIDS: string[] = [
  // 'UID_OF_ADMIN_1',
  // 'UID_OF_ADMIN_2',
];

export async function seedAdmins() {
  if (!db) {
    console.error('Firebase not configured.');
    return;
  }
  if (ADMIN_UIDS.length === 0) {
    console.warn('No UIDs listed in ADMIN_UIDS. Edit src/scripts/seedAdmins.ts first.');
    return;
  }

  for (const uid of ADMIN_UIDS) {
    await setDoc(doc(db, 'admins', uid), { seededAt: Date.now() });
    console.log(`✅ Admin seeded: ${uid}`);
  }
  console.log('Done.');
}
