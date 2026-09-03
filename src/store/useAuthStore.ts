import { create } from 'zustand';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { UserProfile, Role } from '@/types';
import { auth, db, googleProvider } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const SUPER_ADMIN_EMAILS = [
  "azizulhakim886@outlook.com",
  "admin@dreamfashion.zone.id",
  "admin@croynow.com",
  "hodako17@gmail.com",
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  setProfile: (profile: UserProfile | null) => void;
  fetchProfile: (uid: string, fallbackUser?: User) => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (targetUid: string, newRole: Role) => Promise<{ success: boolean; error?: string }>;
  createAdminUser: (email: string, name: string, role: Role) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,

  setProfile: (profile) => {
    const isSuper = isSuperAdminEmail(profile?.email);
    const hasAdminRole = profile?.role === 'admin' || profile?.role === 'super_admin';
    set({
      profile,
      isAdmin: isSuper || hasAdminRole,
    });
  },

  fetchProfile: async (uid: string, fallbackUser?: User) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      const currentUser = fallbackUser || auth.currentUser;
      const isSuper = isSuperAdminEmail(currentUser?.email);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const shouldBeAdmin = isSuper || data.role === 'admin' || data.role === 'super_admin';

        if (isSuper && data.role !== 'admin' && data.role !== 'super_admin') {
          data.role = 'admin';
          try {
            await updateDoc(docRef, { role: 'admin' });
          } catch (e) {}
        }

        set({
          profile: data,
          isAdmin: shouldBeAdmin,
          loading: false,
        });
      } else {
        if (currentUser) {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || (isSuper ? 'Super Administrator' : 'Customer'),
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
            role: isSuper ? 'admin' : 'customer',
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(docRef, newProfile);
          } catch (e) {
            console.warn("User doc sync warning:", e);
          }
          set({ profile: newProfile, isAdmin: isSuper, loading: false });
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const isSuper = isSuperAdminEmail(fbUser.email);

      const userProfile: UserProfile = {
        uid: fbUser.uid,
        name: fbUser.displayName || (isSuper ? 'Super Administrator' : 'Customer'),
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        role: isSuper ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const existingData = snap.data() as UserProfile;
        if (isSuper && existingData.role !== 'admin' && existingData.role !== 'super_admin') {
          existingData.role = 'admin';
          await updateDoc(docRef, { role: 'admin' });
        }
        set({
          user: fbUser,
          profile: existingData,
          isAdmin: isSuper || existingData.role === 'admin' || existingData.role === 'super_admin',
          loading: false,
        });
      } else {
        await setDoc(docRef, userProfile);
        set({
          user: fbUser,
          profile: userProfile,
          isAdmin: isSuper,
          loading: false,
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error("Google OAuth Error:", error);
      set({ loading: false });
      return { success: false, error: error.message || "Failed to sign in with Google" };
    }
  },

  signInWithEmail: async (email: string, pass: string) => {
    try {
      set({ loading: true });
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const isSuper = isSuperAdminEmail(res.user.email);
      await get().fetchProfile(res.user.uid, res.user);
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message || "Invalid email or password" };
    }
  },

  registerWithEmail: async (email: string, pass: string, name: string) => {
    try {
      set({ loading: true });
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const isSuper = isSuperAdminEmail(res.user.email);
      const newProfile: UserProfile = {
        uid: res.user.uid,
        name: name || (isSuper ? "Super Administrator" : "Customer"),
        email: res.user.email || "",
        role: isSuper ? "admin" : "customer",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", res.user.uid), newProfile);
      set({ user: res.user, profile: newProfile, isAdmin: isSuper, loading: false });
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message || "Registration failed" };
    }
  },

  updateUserRole: async (targetUid: string, newRole: Role) => {
    try {
      const docRef = doc(db, 'users', targetUid);
      await updateDoc(docRef, { role: newRole, updatedAt: new Date().toISOString() });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to update user role:", error);
      return { success: false, error: error.message || "Permission denied or Firestore update error" };
    }
  },

  createAdminUser: async (email: string, name: string, role: Role) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const tempId = `usr_${Date.now()}`;
      const newProfile: UserProfile = {
        uid: tempId,
        name: name.trim(),
        email: cleanEmail,
        role: role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", tempId), newProfile);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to create user record" };
    }
  },

  signOut: async () => {
    try {
      await fbSignOut(auth);
      set({ user: null, profile: null, isAdmin: false, loading: false });
    } catch (err) {
      console.error('Sign out error:', err);
    }
  },
}));

// Initialize auth listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      useAuthStore.setState({ user, loading: false });
      await useAuthStore.getState().fetchProfile(user.uid, user);
    } else {
      useAuthStore.setState({ user: null, profile: null, isAdmin: false, loading: false });
    }
  });
}
