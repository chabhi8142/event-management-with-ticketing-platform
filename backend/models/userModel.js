const { getFirestore } = require('../config/firebase');
const { getAuth } = require('../config/firebase');

const usersCollection = getFirestore().collection('users');
const auth = getAuth();

async function createUserProfile(uid, profileData) {
  await usersCollection.doc(uid).set(profileData);
  return uid;
}

async function getUserProfile(uid) {
  const snapshot = await usersCollection.doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }
  return { id: snapshot.id, ...snapshot.data() };
}

async function updateUserProfile(uid, updates) {
  await usersCollection.doc(uid).update(updates);
  return getUserProfile(uid);
}

async function getAllUsers() {
  const snapshot = await usersCollection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getUsersByRole(role) {
  const snapshot = await usersCollection.where('role', '==', role).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function blockUser(uid) {
  await usersCollection.doc(uid).update({ status: 'blocked' });
  await auth.updateUser(uid, { disabled: true });
}

async function unblockUser(uid) {
  await usersCollection.doc(uid).update({ status: 'active' });
  await auth.updateUser(uid, { disabled: false });
}

async function deleteUserProfile(uid) {
  await usersCollection.doc(uid).delete();
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    console.error('Error deleting user from Auth:', error);
  }
}

async function approveOrganiser(uid) {
  await usersCollection.doc(uid).update({ isApproved: true, approvedAt: new Date().toISOString() });
  await auth.setCustomUserClaims(uid, { role: 'organiser' });
}

async function rejectOrganiser(uid) {
  await usersCollection.doc(uid).delete();
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    console.error('Error deleting rejected organiser:', error);
  }
}

module.exports = {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUsersByRole,
  blockUser,
  unblockUser,
  deleteUserProfile,
  approveOrganiser,
  rejectOrganiser,
};
