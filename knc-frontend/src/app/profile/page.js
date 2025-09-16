"use client";

import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { 
  FiUser, 
  FiCreditCard, 
  FiEdit3, 
  FiLogOut, 
  FiCheck, 
  FiX, 
  FiAlertTriangle,
  FiLoader
} from "react-icons/fi";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    message: "",
    type: "info",
    isVisible: false,
  });

  const router = useRouter();

  const showToast = (message, type = "info") => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
          router.push("/auth/login");
          return;
        }

        const response = await fetch(
          `http://localhost:8000/auth/profile/${storedUsername}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData);
        setEditForm({
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values when canceling
      setEditForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    setUpdateLoading(true);

    try {
      const storedUsername = localStorage.getItem("username");
      const response = await fetch(
        `http://localhost:8000/auth/profile/${storedUsername}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to update profile");
      }

      setUser(result);
      setIsEditing(false);
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    router.push("/auth/login");
  };

  // check if form has changes
  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      editForm.first_name !== user.first_name ||
      editForm.last_name !== user.last_name ||
      editForm.email !== user.email
    );
  }, [editForm, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center space-x-3">
            <FiLoader className="animate-spin h-6 w-6 text-primary" />
            <p className="text-lg text-gray-dark">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-8 h-8 text-error" />
          </div>
          <p className="text-lg text-error mb-2">Failed to load user profile</p>
          <p className="text-gray-sub">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray">
      <Sidebar />

      <div className="w-4/5 flex h-screen flex-col items-center">
        {/* HEADER */}
        <div className="flex items-center w-full h-24 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
          <h1 className="text-primary text-4xl font-semibold mx-8">Profile</h1>
        </div>

        {/* Content */}
        <div className="flex-1 w-full py-12 overflow-y-auto">
          <div className="mx-40 space-y-8">
            {/* Welcome Card */}
            <div className="bg-white rounded-2xl p-8 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-dark mb-2">
                  Welcome back, {user.first_name}!
                </h2>
                <p className="text-gray-sub">Here's your account overview</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
                <h3 className="text-xl font-semibold text-gray-dark mb-4 flex items-center">
                  <FiUser className="w-5 h-5 mr-2 text-primary" />
                  Personal Details
                </h3>

                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveChanges();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={user.username}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-sub mt-1">
                        Username cannot be changed
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        Full Name
                      </label>
                      <p className="text-lg text-gray-dark font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        Username
                      </label>
                      <p className="text-lg text-gray-dark">{user.username}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        Email Address
                      </label>
                      <p className="text-lg text-gray-dark">{user.email}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-sub block mb-1">
                        Member Since
                      </label>
                      <p className="text-lg text-gray-dark">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
                <h3 className="text-xl font-semibold text-gray-dark mb-4 flex items-center">
                  <FiCreditCard className="w-5 h-5 mr-2 text-primary" />
                  Account Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-sub block mb-1">
                      Current Balance
                    </label>
                    <div className="flex items-center">
                      <p className="text-3xl font-bold text-black">
                        PHP
                        <span className="text-primary ml-2">
                          {user.balance.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-light">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-sub">Account Status</span>
                      <span className="px-3 py-1 bg-success/10 text-success font-medium rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
              <h3 className="text-xl font-semibold text-gray-dark mb-4">
                Account Actions
              </h3>

              <div className="flex flex-wrap gap-4">
                {isEditing ? (
                  <>
                    {/* Cancel Button */}
                    <button
                      onClick={handleEditToggle}
                      className="px-6 py-3 bg-error text-white font-semibold rounded-xl hover:bg-error/90 transition-all duration-200 flex items-center shadow-sm cursor-pointer"
                    >
                      <FiX className="w-4 h-4 mr-2" />
                      Cancel
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveChanges}
                      disabled={updateLoading || !hasChanges}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {updateLoading ? (
                        <>
                          <FiLoader className="animate-spin h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiCheck className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="group px-6 py-3 bg-error text-white font-semibold rounded-xl hover:bg-error/90 transition-all duration-200 flex items-center shadow-sm cursor-pointer"
                    >
                      <FiLogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Sign Out
                    </button>

                    {/* Edit Profile Button */}
                    <button
                      onClick={handleEditToggle}
                      className="px-6 py-3 bg-primary-subtle text-primary font-semibold rounded-xl hover:bg-primary-subtle/80 transition-all duration-200 flex items-center border border-primary/20 cursor-pointer"
                    >
                      <FiEdit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}