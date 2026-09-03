"use client";

import { useState, useEffect, useMemo } from "react";
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
  UserPlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { collection, getDocs, query, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, Role } from "@/types";
import { useAuthStore, isSuperAdminEmail } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";

const ITEMS_PER_PAGE = 8;

export default function AdminUsersPage() {
  const { profile, user: currentUser, updateUserRole, createAdminUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Add Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<Role>("admin");
  const [isCreating, setIsCreating] = useState(false);

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

      if (list.length === 0) {
        setUsers([
          {
            uid: currentUser?.uid || "admin_user_01",
            name: profile?.name || "Azizul Hakim",
            email: profile?.email || "azizulhakim886@outlook.com",
            role: "admin",
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setUsers(list);
      }
    } catch (err) {
      console.warn("Firestore users read fallback:", err);
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

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (isSuperAdminEmail(targetUser.email)) {
      addToast("Protected Master Admin cannot be deleted.", "error");
      return;
    }

    if (currentUser && targetUser.uid === currentUser.uid) {
      addToast("You cannot delete your own active administrator account.", "error");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${targetUser.name || targetUser.email}"?`)) {
      return;
    }

    setDeletingUid(targetUser.uid);
    try {
      await deleteDoc(doc(db, "users", targetUser.uid));
      setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid));
      addToast(`User ${targetUser.email} has been permanently deleted.`, "success");
    } catch (err: any) {
      // Fallback local remove
      setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid));
      addToast(`User removed from local state.`, "info");
    } finally {
      setDeletingUid(null);
    }
  };

  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminName.trim()) return;

    setIsCreating(true);
    const res = await createAdminUser(newAdminEmail, newAdminName, newAdminRole);
    setIsCreating(false);

    if (res.success) {
      addToast(`Admin record for ${newAdminEmail} created successfully!`, "success");
      setIsModalOpen(false);
      setNewAdminName("");
      setNewAdminEmail("");
      fetchUsers();
    } else {
      addToast(res.error || "Failed to create admin user", "error");
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-admin-border-light">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            ACCESS CONTROL & SECURITY
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-admin-accent" />
            <span>User & Admin Management</span>
          </h1>
          <p className="text-xs text-admin-text-secondary-light mt-0.5">
            Super Admin: <strong className="text-admin-accent font-mono">azizulhakim886@outlook.com</strong>. Manage roles, permissions, and staff accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            className="px-3.5 py-2.5 bg-white border border-admin-border-light hover:border-ink-900 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Grant Admin Access</span>
          </button>
        </div>
      </div>

      {/* Super Admin Notice Pill */}
      {isSuperAdmin && (
        <div className="p-4 bg-df-success-soft border border-df-success/30 rounded-2xl flex items-center gap-3 text-xs text-df-success">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div>
            <strong className="uppercase">Super Administrator Privileges Active:</strong> You have master access to promote, assign staff roles, grant admin powers, or delete any customer account.
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-admin-border-light rounded-xl text-xs text-ink-900 focus:outline-none focus:border-admin-accent shadow-2xs"
          />
        </div>

        <span className="text-xs text-admin-text-secondary-light font-mono self-end sm:self-center">
          Showing {filteredUsers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} Users
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-admin-border-light rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle text-ink-600 font-bold uppercase tracking-wider border-b border-admin-border-light text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions & Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-500">
                    <span className="df-spinner df-spinner--sm inline-block mr-2" />
                    Loading registered users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-500">
                    No users found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isUserSuperAdmin = isSuperAdminEmail(u.email);

                  return (
                    <tr key={u.uid} className="hover:bg-bg-subtle/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-admin-accent/15 text-admin-accent font-black text-xs flex items-center justify-center">
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
                            u.role === "admin" || u.role === "super_admin"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : u.role === "staff"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {(u.role === "admin" || u.role === "super_admin") && <Shield className="w-3 h-3 text-amber-600" />}
                          {u.role}
                          {isUserSuperAdmin && " (SUPER)"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-ink-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                      </td>

                      {/* Role Actions & Delete User */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isUserSuperAdmin && (
                            <>
                              <button
                                type="button"
                                disabled={updatingUid === u.uid || u.role === "admin"}
                                onClick={() => handleRoleChange(u.uid, "admin")}
                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${
                                  u.role === "admin"
                                    ? "bg-amber-600 text-white"
                                    : "bg-bg-subtle hover:bg-amber-100 text-amber-900 border border-amber-300"
                                }`}
                              >
                                Admin
                              </button>

                              <button
                                type="button"
                                disabled={updatingUid === u.uid || u.role === "staff"}
                                onClick={() => handleRoleChange(u.uid, "staff")}
                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${
                                  u.role === "staff"
                                    ? "bg-blue-600 text-white"
                                    : "bg-bg-subtle hover:bg-blue-100 text-blue-800 border border-blue-300"
                                }`}
                              >
                                Staff
                              </button>

                              <button
                                type="button"
                                disabled={updatingUid === u.uid || u.role === "customer"}
                                onClick={() => handleRoleChange(u.uid, "customer")}
                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${
                                  u.role === "customer"
                                    ? "bg-gray-700 text-white"
                                    : "bg-bg-subtle hover:bg-gray-200 text-gray-700 border border-line-200"
                                }`}
                              >
                                User
                              </button>

                              {/* Delete User Button */}
                              <button
                                type="button"
                                disabled={deletingUid === u.uid}
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user"
                                className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors border border-red-200 cursor-pointer disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {isUserSuperAdmin && (
                            <span className="text-[10px] font-bold text-df-success uppercase bg-df-success-soft px-2 py-0.5 rounded">
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-admin-border-light flex items-center justify-between bg-bg-subtle/50 text-xs">
            <span className="text-admin-text-secondary-light font-mono">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-admin-border-light bg-white hover:bg-line-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#FFB900] text-black font-black"
                      : "bg-white border border-admin-border-light hover:bg-line-200 text-ink-800"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-admin-border-light bg-white hover:bg-line-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Grant Admin Access to New User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 z-50 border border-admin-border-light space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border-light">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-admin-accent" />
                <span>Grant Admin Privileges</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewAdmin} className="space-y-3.5">
              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Co-Administrator Name"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. partner@dreamfashion.zone.id"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Access Level
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as Role)}
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded-lg uppercase font-bold cursor-pointer"
                >
                  <option value="admin">Full Administrator (All Access)</option>
                  <option value="staff">Store Staff (Orders & Delivery)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-admin-border-light">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-line-200 hover:bg-line-300 text-ink-800 rounded-lg font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-[#FFB900] hover:bg-[#E5A700] text-black font-black uppercase rounded-lg tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  {isCreating ? "Granting..." : "Confirm & Save Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

