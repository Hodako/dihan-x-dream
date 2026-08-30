"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Search,
  CheckCircle2,
  RefreshCw,
  Mail,
  Calendar,
} from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, Role } from "@/types";
import { useAuthStore, isSuperAdminEmail } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";

export default function AdminUsersPage() {
  const { profile, user: currentUser, updateUserRole } = useAuthStore();
  const { addToast } = useUIStore();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const isSuperAdmin = isSuperAdminEmail(profile?.email || currentUser?.email);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(list);
    } catch (err) {
      console.warn("Firestore users read fallback:", err);
      // Fallback display
      setUsers([
        {
          uid: currentUser?.uid || "admin_user_01",
          name: profile?.name || "Azizul Hakim",
          email: profile?.email || "azizulhakim886@outlook.com",
          role: "admin",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUid: string, newRole: Role) => {
    setUpdatingUid(targetUid);
    const res = await updateUserRole(targetUid, newRole);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u))
      );
      addToast(`User role updated to ${newRole.toUpperCase()}!`, "success");
    } else {
      addToast(res.error || "Failed to update role", "error");
    }
    setUpdatingUid(null);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-admin-accent" />
            <span>User & Admin Management</span>
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            Default Super Admin: <strong className="text-admin-accent">azizulhakim886@outlook.com</strong>. Manage roles & permissions.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 bg-white border border-line-200 hover:border-ink-900 rounded-lg text-xs font-semibold uppercase flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Super Admin Notice Pill */}
      {isSuperAdmin && (
        <div className="p-4 bg-df-success-soft border border-df-success/30 rounded-2xl flex items-center gap-3 text-xs text-df-success">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong className="uppercase">Super Administrator Privileges Active:</strong> You have master access to promote, assign staff roles, or grant admin powers to any customer.
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-line-200 rounded-xl text-xs focus:outline-none focus:border-ink-900"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white border border-line-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle text-ink-600 font-bold uppercase tracking-wider border-b border-line-200 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-500">
                    Loading registered users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-500">
                    No users matching search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserSuperAdmin = isSuperAdminEmail(u.email);

                  return (
                    <tr key={u.uid} className="hover:bg-bg-subtle/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-admin-accent/15 text-admin-accent font-bold text-xs flex items-center justify-center">
                            {u.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="font-bold text-ink-900 uppercase block leading-tight">
                              {u.name || "Customer"}
                            </span>
                            <span className="text-[10px] text-ink-400 font-mono">
                              UID: {u.uid.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-ink-700">
                        {u.email}
                      </td>

                      {/* Current Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "staff"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role === "admin" && <Shield className="w-3 h-3" />}
                          {u.role}
                          {isUserSuperAdmin && " (SUPER)"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-ink-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                      </td>

                      {/* Role Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isUserSuperAdmin ? (
                          <span className="text-[10px] font-bold text-df-success uppercase">
                            Protected Master Admin
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={updatingUid === u.uid || u.role === "admin"}
                              onClick={() => handleRoleChange(u.uid, "admin")}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${
                                u.role === "admin"
                                  ? "bg-purple-600 text-white"
                                  : "bg-bg-subtle hover:bg-purple-100 text-purple-800 border border-purple-300"
                              }`}
                            >
                              Make Admin
                            </button>

                            <button
                              type="button"
                              disabled={updatingUid === u.uid || u.role === "staff"}
                              onClick={() => handleRoleChange(u.uid, "staff")}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${
                                u.role === "staff"
                                  ? "bg-blue-600 text-white"
                                  : "bg-bg-subtle hover:bg-blue-100 text-blue-800 border border-blue-300"
                              }`}
                            >
                              Make Staff
                            </button>

                            <button
                              type="button"
                              disabled={updatingUid === u.uid || u.role === "customer"}
                              onClick={() => handleRoleChange(u.uid, "customer")}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${
                                u.role === "customer"
                                  ? "bg-gray-700 text-white"
                                  : "bg-bg-subtle hover:bg-gray-200 text-gray-700 border border-line-200"
                              }`}
                            >
                              Demote
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
