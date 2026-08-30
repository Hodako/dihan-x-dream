import { create } from 'zustand';
import { User, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { UserProfile, Role } from '@/types';
import { auth, db, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const SUPER_ADMIN_EMAILS = [
  "azizulhakim886@outlook.com",
  "admin@dreamfashionbd.com",
  "admin@croynow.com"
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
  updateUserRole: (targetUid: string, newRole: Role) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,

  setProfile: (profile) => {
    const isSuperAdmin = isSuperAdminEmail(profile?.email);
    set({
      profile,
      isAdmin: isSuperAdmin || profile?.role === 'admin',
    });
  },

  fetchProfile: async (uid: string, fallbackUser?: User) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      const currentUser = fallbackUser || auth.currentUser;
      const isSuperAdmin = isSuperAdminEmail(currentUser?.email);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const shouldBeAdmin = isSuperAdmin || data.role === 'admin';
        
        // If super admin email, ensure role is 'admin' in Firestore
        if (isSuperAdmin && data.role !== 'admin') {
          data.role = 'admin';
          try {
            await updateDoc(docRef, { role: 'admin' });
          } catch (e) {}
        }

        set({
          profile: data,
          isAdmin: shouldBeAdmin,
        });
      } else {
        // Create profile if new user
        if (currentUser) {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || (isSuperAdmin ? 'Super Administrator' : 'Customer'),
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
            role: isSuperAdmin ? 'admin' : 'customer',
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(docRef, newProfile);
          } catch (e) {
            console.warn("User doc sync warning:", e);
          }
          set({ profile: newProfile, isAdmin: isSuperAdmin });
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const isSuperAdmin = isSuperAdminEmail(fbUser.email);
      
      const userProfile: UserProfile = {
        uid: fbUser.uid,
        name: fbUser.displayName || (isSuperAdmin ? 'Super Administrator' : 'Customer'),
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        role: isSuperAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
      };

      try {
        const docRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const existingData = snap.data() as UserProfile;
          if (isSuperAdmin && existingData.role !== 'admin') {
            existingData.role = 'admin';
            await updateDoc(docRef, { role: 'admin' });
          }
          set({
            user: fbUser,
            profile: existingData,
            isAdmin: isSuperAdmin || existingData.role === 'admin',
            loading: false
          });
          return { success: true };
        } else {
          await setDoc(docRef, userProfile);
        }
      } catch (err) {
        console.warn("Firestore user sync:", err);
      }

      set({
        user: fbUser,
        profile: userProfile,
        isAdmin: isSuperAdmin,
        loading: false
      });
      return { success: true };
    } catch (error: any) {
      console.error("Google OAuth Error:", error);
      set({ loading: false });
      return { 
        success: false, 
        error: error.message || "Failed to sign in with Google" 
      };
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

  signOut: async () => {
    try {
      await fbSignOut(auth);
      set({ user: null, profile: null, isAdmin: false });
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
