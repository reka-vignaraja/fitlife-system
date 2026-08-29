"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminReport = {
  id: string;
  user: string;
  email: string;
  reportType: string;
  bmi: string;
  healthRisk: string;
  dietStatus: string;
  fitness: string;
  sleep: string;
  status: string;
  date: string;
  summary: string;
};

export default function AdminReportsPage() {
  const router = useRouter();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("fitlife_admin_token");

        if (!token) {
          router.replace("/admin/login");
          return;
        }

        const response = await fetch("http://localhost:8000/api/admin/reports", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.detail || "Failed to load reports.");
        }

        setReports(data.reports || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading reports."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [router]);

  const generatedReports = reports.filter(
    (report) => report.status === "Generated"
  );

  const highRiskReports = reports.filter(
    (report) => report.healthRisk === "High Risk"
  );

  const filteredReports = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        report.user.toLowerCase().includes(search) ||
        report.email.toLowerCase().includes(search) ||
        report.reportType.toLowerCase().includes(search) ||
        report.healthRisk.toLowerCase().includes(search);

      const matchesRisk =
        riskFilter === "All" || report.healthRisk === riskFilter;

      const matchesStatus =
        statusFilter === "All" || report.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [reports, searchText, riskFilter, statusFilter]);

  const escapeCsvValue = (value: string | number) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    if (filteredReports.length === 0) {
      alert("No report records available to export.");
      return;
    }

    const headers = [
      "User",
      "Email",
      "Report Type",
      "BMI",
      "Health Risk",
      "Diet Status",
      "Fitness Goal",
      "Sleep Status",
      "Status",
      "Generated Date",
      "Summary",
    ];

    const rows = filteredReports.map((report) => [
      report.user,
      report.email,
      report.reportType,
      report.bmi,
      report.healthRisk,
      report.dietStatus,
      report.fitness,
      report.sleep,
      report.status,
      report.date,
      report.summary,
    ]);

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);

    downloadLink.href = url;
    downloadLink.download = `fitlife-progress-reports-${today}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="adminListPage">
      <section className="adminListTop">
        <div>
          <span className="adminBadge">Report Monitoring</span>

          <h1>Progress Reports</h1>

          <p>
            View generated FitLife progress reports, BMI results, health risk
            level, diet status, fitness goal, and sleep status.
          </p>
        </div>

        <div className="adminListStats">
          <div>
            <strong>{reports.length}</strong>
            <span>Total Reports</span>
          </div>

          <div>
            <strong>{generatedReports.length}</strong>
            <span>Generated</span>
          </div>

          <div>
            <strong>{highRiskReports.length}</strong>
            <span>High Risk</span>
          </div>
        </div>
      </section>

      <section className="adminReportFilterCard">
        <div className="adminSearchBox">
          <label>Search Reports</label>

          <input
            type="text"
            placeholder="Search by user, email, report type, or risk..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="adminSelectBox">
          <label>Health Risk</label>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="All">All Risks</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="High Risk">High Risk</option>
            <option value="Not calculated">Not Calculated</option>
          </select>
        </div>

        <div className="adminSelectBox">
          <label>Report Status</label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Generated">Generated</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="adminFilterResult">
          <strong>{filteredReports.length}</strong>
          <span>Matching Reports</span>
        </div>
      </section>

      {loading && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Loading reports...</h3>
            <p>Please wait while FitLife loads generated reports.</p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>Unable to load reports</h3>
            <p>{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && filteredReports.length === 0 && (
        <section className="adminTableCard">
          <div className="adminEmptyState">
            <h3>No reports found</h3>
            <p>Try changing the search keyword, risk filter, or status filter.</p>
          </div>
        </section>
      )}

      {!loading && !error && filteredReports.length > 0 && (
        <section className="adminTableCard">
          <div className="adminTableHeader">
            <div>
              <h2>Report Records</h2>
              <p>Showing {filteredReports.length} matching report records.</p>
            </div>

            <button
              type="button"
              className="adminExportBtn"
              onClick={handleExportCsv}
            >
              Export CSV
            </button>
          </div>

          <div className="adminTableScroll">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>BMI</th>
                  <th>Health Risk</th>
                  <th>Diet</th>
                  <th>Fitness</th>
                  <th>Sleep</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong>{report.user}</strong>
                    </td>

                    <td>{report.email}</td>

                    <td>{report.bmi}</td>

                    <td>
                      <span
                        className={
                          report.healthRisk === "Low Risk"
                            ? "adminStatusBadge adminStatusSuccess"
                            : report.healthRisk === "High Risk"
                            ? "adminStatusBadge adminStatusDanger"
                            : "adminStatusBadge adminStatusWarning"
                        }
                      >
                        {report.healthRisk}
                      </span>
                    </td>

                    <td>{report.dietStatus}</td>

                    <td>{report.fitness}</td>

                    <td>{report.sleep}</td>

                    <td>{report.date}</td>

                    <td>
                      <button
                        type="button"
                        className="adminViewBtn"
                        onClick={() => setSelectedReport(report)}
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

      {selectedReport && (
        <div className="adminModalOverlay">
          <div className="adminUserModal">
            <div className="adminModalTop">
              <div>
                <span className="adminBadge">Report Details</span>
                <h2>{selectedReport.user}</h2>
                <p>{selectedReport.email}</p>
              </div>

              <button
                type="button"
                className="adminModalClose"
                onClick={() => setSelectedReport(null)}
              >
                ×
              </button>
            </div>

            <div className="adminUserDetailGrid">
              <div>
                <span>Report Type</span>
                <strong>{selectedReport.reportType}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedReport.status}</strong>
              </div>

              <div>
                <span>BMI</span>
                <strong>{selectedReport.bmi}</strong>
              </div>

              <div>
                <span>Health Risk</span>
                <strong>{selectedReport.healthRisk}</strong>
              </div>

              <div>
                <span>Diet Status</span>
                <strong>{selectedReport.dietStatus}</strong>
              </div>

              <div>
                <span>Fitness Goal</span>
                <strong>{selectedReport.fitness}</strong>
              </div>

              <div>
                <span>Sleep Status</span>
                <strong>{selectedReport.sleep}</strong>
              </div>

              <div>
                <span>Generated Date</span>
                <strong>{selectedReport.date}</strong>
              </div>
            </div>

            <div className="adminReportSummaryBox">
              <span>Report Summary</span>
              <p>{selectedReport.summary}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}