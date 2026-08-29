"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  goal: string;
  joined: string;
  age: string;
  gender: string;
  bmi: string;
  activityLevel: string;
  fitnessLevel: string;
  workoutDays: string;
  location: string;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("fitlife_admin_token");

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("http://localhost:8000/api/admin/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.detail || "Failed to load users.");
        }

        setUsers(data.users || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading users."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const verifiedUsers = users.filter((user) => user.status === "Verified");
  const notVerifiedUsers = users.filter((user) => user.status !== "Verified");

  const filteredUsers = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.goal.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchText, statusFilter]);

  return (
    <main className="adminListPage">
      <section className="adminListTop">
        <div>
          <span className="adminBadge">User Management</span>

          <h1>Registered Users</h1>

          <p>
            View registered FitLife users, verification status, profile details,
            fitness goals, and account information.
          </p>
        </div>

        <div className="adminListStats">
          <div>
            <strong>{users.length}</strong>
            <span>Total Users</span>
          </div>

          <div>
            <strong>{verifiedUsers.length}</strong>
            <span>Verified</span>
          </div>

          <div>
            <strong>{notVerifiedUsers.length}</strong>
            <span>Not Verified</span>
          </div>
        </div>
      </section>

      <section className="adminFilterCard">
        <div className="adminSearchBox">
          <label>Search Users</label>

          <input
            type="text"
            placeholder="Search by name, email, or goal..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="adminSelectBox">
          <label>Verification Status</label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Users</option>
            <option value="Verified">Verified</option>
            <option value="Not Verified">Not Verified</option>
          </select>
        </div>

        <div className="adminFilterResult">
          <strong>{filteredUsers.length}</strong>
          <span>Matching Users</span>
        </div>
      </section>

      {loading && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Loading users...</h3>
            <p>Please wait while FitLife loads registered users.</p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Unable to load users</h3>
            <p>{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && filteredUsers.length === 0 && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>No users found</h3>
            <p>Try changing the search keyword or verification filter.</p>
          </div>
        </section>
      )}

      {!loading && !error && filteredUsers.length > 0 && (
        <section className="adminTableCard">
          <div className="adminTableHeader">
            <div>
              <h2>User Records</h2>
              <p>Showing {filteredUsers.length} matching user records.</p>
            </div>
          </div>

          <div className="adminTableScroll">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Goal</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span
                        className={
                          user.status === "Verified"
                            ? "adminStatusBadge adminStatusSuccess"
                            : "adminStatusBadge adminStatusWarning"
                        }
                      >
                        {user.status}
                      </span>
                    </td>

                    <td>{user.goal}</td>

                    <td>{user.joined}</td>

                    <td>
                      <button
                        type="button"
                        className="adminViewBtn"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedUser && (
        <div className="adminModalOverlay">
          <div className="adminUserModal">
            <div className="adminModalTop">
              <div>
                <span className="adminBadge">User Details</span>
                <h2>{selectedUser.name}</h2>
                <p>{selectedUser.email}</p>
              </div>

              <button
                type="button"
                className="adminModalClose"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
            </div>

            <div className="adminUserDetailGrid">
              <div>
                <span>Status</span>
                <strong>{selectedUser.status}</strong>
              </div>

              <div>
                <span>Fitness Goal</span>
                <strong>{selectedUser.goal}</strong>
              </div>

              <div>
                <span>Joined Date</span>
                <strong>{selectedUser.joined}</strong>
              </div>

              <div>
                <span>Age</span>
                <strong>{selectedUser.age}</strong>
              </div>

              <div>
                <span>Gender</span>
                <strong>{selectedUser.gender}</strong>
              </div>

              <div>
                <span>BMI</span>
                <strong>{selectedUser.bmi}</strong>
              </div>

              <div>
                <span>Activity Level</span>
                <strong>{selectedUser.activityLevel}</strong>
              </div>

              <div>
                <span>Fitness Level</span>
                <strong>{selectedUser.fitnessLevel}</strong>
              </div>

              <div>
                <span>Workout Days</span>
                <strong>{selectedUser.workoutDays}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{selectedUser.location}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}