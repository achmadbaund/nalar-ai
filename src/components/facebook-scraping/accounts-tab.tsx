"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  MoreVertical,
  Eye,
  Play,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Square,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  triggerCrawl,
  getJobs,
  type FacebookAccount,
  type PaginatedResponse,
} from "@/utils/api/facebookApi";
import { toast } from "sonner";
import AddAccountModal from "./add-account-modal";
import EditAccountModal from "./edit-account-modal";
import ViewAccountModal from "./view-account-modal";

export default function AccountsTab() {
  const [data, setData] = useState<PaginatedResponse<FacebookAccount> | FacebookAccount[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastToastRef = useRef<string | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const [filters, setFilters] = useState({
    active: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FacebookAccount | null>(null);
  const [crawlingIds, setCrawlingIds] = useState<Set<number>>(new Set());
  const [activeJobAccountIds, setActiveJobAccountIds] = useState<Set<number>>(new Set());
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [jobStartTimes, setJobStartTimes] = useState<Map<number, number>>(new Map()); // Track when jobs started
  const MAX_POLLING_DURATION = 30 * 60 * 1000; // 30 menit maksimal polling

  const fetchAccounts = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (filters.active !== "") {
        params.active = filters.active === "true";
      }

      const response = await getAccounts(params);
      setData(response);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch accounts";
      setError(errorMessage);
      
      if (!silent) {
        // Prevent duplicate toast within 2 seconds
        const now = Date.now();
        if (lastToastRef.current !== errorMessage || now - lastToastTimeRef.current > 2000) {
          toast.error(errorMessage);
          lastToastRef.current = errorMessage;
          lastToastTimeRef.current = now;
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Fetch active jobs untuk monitoring
  const fetchActiveJobs = async () => {
    try {
      const jobsResponse = await getJobs({
        status: "running",
        page_size: 100,
      });
      
      const pendingJobsResponse = await getJobs({
        status: "pending",
        page_size: 100,
      });

      const allActiveJobs = [
        ...(jobsResponse.results || []),
        ...(pendingJobsResponse.results || []),
      ];

      const accountIdsWithActiveJobs = new Set<number>();
      const now = Date.now();
      const newJobStartTimes = new Map(jobStartTimes);

      allActiveJobs.forEach((job) => {
        // Hanya tambahkan jika status benar-benar running atau pending
        if (job.account && (job.status === "running" || job.status === "pending")) {
          // Track start time jika belum ada
          if (!newJobStartTimes.has(job.account)) {
            newJobStartTimes.set(job.account, job.started_at ? new Date(job.started_at).getTime() : now);
          }
          
          // Check jika job sudah terlalu lama (lebih dari 30 menit)
          const startTime = newJobStartTimes.get(job.account) || now;
          const duration = now - startTime;
          
          if (duration > MAX_POLLING_DURATION) {
            // Job sudah terlalu lama, anggap sebagai stuck dan stop polling
            console.warn(`Job for account ${job.account} has been running for too long (${Math.round(duration / 60000)} minutes). Stopping polling.`);
            toast.error(`Crawl job untuk account ${job.account_username || job.account} sudah berjalan terlalu lama (${Math.round(duration / 60000)} menit). Silakan cek status di backend atau hubungi administrator.`);
            // Jangan tambahkan ke activeJobAccountIds
            newJobStartTimes.delete(job.account);
          } else {
            accountIdsWithActiveJobs.add(job.account);
          }
        } else {
          // Job sudah completed/failed, hapus dari tracking
          newJobStartTimes.delete(job.account);
        }
      });

      setJobStartTimes(newJobStartTimes);

      // Clear activeJobAccountIds jika tidak ada lagi active jobs
      // Ini penting untuk stop polling dan update UI
      setActiveJobAccountIds(accountIdsWithActiveJobs);
      
      // Jika tidak ada lagi active jobs, clear crawlingIds juga
      if (accountIdsWithActiveJobs.size === 0) {
        setCrawlingIds(new Set());
        setJobStartTimes(new Map());
      }
    } catch (err) {
      // Silent fail untuk polling
      console.error("Failed to fetch active jobs:", err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, pageSize, filters.active]);

  // Auto-refresh jika ada crawl yang sedang berjalan
  useEffect(() => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Jika ada account dengan active jobs atau crawling, mulai polling setiap 3 detik
    if (activeJobAccountIds.size > 0 || crawlingIds.size > 0) {
      const interval = setInterval(() => {
        fetchActiveJobs(); // Update active jobs
        fetchAccounts(true); // Silent refresh accounts
      }, 3000); // Refresh setiap 3 detik
      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else {
      setPollingInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJobAccountIds.size, crawlingIds.size]);

  // Initial fetch active jobs
  useEffect(() => {
    fetchActiveJobs();
  }, []);

  const handleAdd = () => {
    setSelectedAccount(null);
    setShowAddModal(true);
  };

  const handleEdit = (account: FacebookAccount) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleView = async (account: FacebookAccount) => {
    try {
      const fullAccount = await getAccount(account.id);
      setSelectedAccount(fullAccount);
      setShowViewModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch account details");
    }
  };

  const handleDelete = async (account: FacebookAccount) => {
    if (!confirm(`Are you sure you want to delete account "${account.username}"?`)) {
      return;
    }

    try {
      await deleteAccount(account.id);
      toast.success("Account deleted successfully");
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  };

  const handleCrawl = async (account: FacebookAccount) => {
    try {
      // Tambahkan ke crawlingIds dan activeJobAccountIds untuk tracking SEBELUM trigger crawl
      // Ini akan langsung memulai polling dan monitoring
      setCrawlingIds((prev) => new Set(prev).add(account.id));
      setActiveJobAccountIds((prev) => new Set(prev).add(account.id));
      
      // Track start time untuk timeout detection
      setJobStartTimes((prev) => {
        const newMap = new Map(prev);
        newMap.set(account.id, Date.now());
        return newMap;
      });
      
      const result = await triggerCrawl(account.id);
      toast.success(result.message || "Crawl triggered successfully");
      
      // Refresh data langsung setelah trigger crawl untuk mendapatkan status terbaru
      await fetchAccounts(true); // Silent refresh
      await fetchActiveJobs(); // Update active jobs
      
      // Refresh lagi setelah delay kecil untuk memastikan backend sudah update status
      setTimeout(() => {
        fetchAccounts(true); // Silent refresh setelah 500ms
        fetchActiveJobs();
      }, 500);
      
      setTimeout(() => {
        fetchAccounts(true); // Silent refresh setelah 1.5 detik
        fetchActiveJobs();
      }, 1500);
      
      // Polling sudah otomatis dimulai karena activeJobAccountIds sudah diupdate
      // Polling akan terus berjalan setiap 3 detik sampai tidak ada active jobs atau timeout
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger crawl");
      // Hapus dari tracking jika error
      setCrawlingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(account.id);
        return newSet;
      });
      setActiveJobAccountIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(account.id);
        return newSet;
      });
      setJobStartTimes((prev) => {
        const newMap = new Map(prev);
        newMap.delete(account.id);
        return newMap;
      });
    } finally {
      // Hapus dari crawlingIds setelah beberapa detik (untuk loading indicator)
      setTimeout(() => {
        setCrawlingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(account.id);
          return newSet;
        });
      }, 2000);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchAccounts();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedAccount(null);
    fetchAccounts();
  };

  const handleStopPolling = () => {
    // Clear polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    // Clear semua tracking state
    setActiveJobAccountIds(new Set());
    setCrawlingIds(new Set());
    setJobStartTimes(new Map());
    
    // Refresh accounts untuk mendapatkan status terbaru
    fetchAccounts();
    
    toast.success("Polling dihentikan. Refresh halaman untuk status terbaru.");
  };

  const accounts = Array.isArray(data) ? data : data?.results || [];
  const pagination = Array.isArray(data) ? null : data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Status Filter</label>
            <select
              value={filters.active}
              onChange={(e) => {
                setFilters({ ...filters, active: e.target.value });
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              placeholder="Search by username..."
              className="h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(activeJobAccountIds.size > 0 || crawlingIds.size > 0) && (
            <Button
              onClick={handleStopPolling}
              variant="outline"
              className="flex items-center gap-2"
              title="Stop polling yang sedang berjalan"
            >
              <Square className="h-4 w-4" />
              Stop Polling
            </Button>
          )}
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="rounded-md border border-border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">No</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Display Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Posts</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Last Crawl</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No accounts found
                    </td>
                  </tr>
                ) : (
                  accounts
                    .filter((account) => {
                      if (filters.search) {
                        return account.username.toLowerCase().includes(filters.search.toLowerCase());
                      }
                      return true;
                    })
                    .map((account, index) => (
                      <tr key={account.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          {(pagination ? (pagination.page - 1) * pagination.page_size : (page - 1) * pageSize) + index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{account.username}</td>
                        <td className="px-4 py-3 text-sm">{account.name || account.display_name || "-"}</td>
                        <td className="px-4 py-3">
                          {activeJobAccountIds.has(account.id) ? (
                            <div className="flex items-center gap-2">
                              <StatusBadge status="crawling" type="account_status" />
                              <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>
                            </div>
                          ) : (
                            <StatusBadge status={account.status} type="account_status" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{account.post_count || 0}</td>
                        <td className="px-4 py-3 text-sm">
                          {account.last_crawled_at
                            ? new Date(account.last_crawled_at).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCrawl(account)}
                              disabled={crawlingIds.has(account.id)}
                              className="h-8"
                            >
                              {crawlingIds.has(account.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(account)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(account)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(account)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.count > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.count)} of{" "}
                {pagination.count} accounts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.previous}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddAccountModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
      {showEditModal && selectedAccount && (
        <EditAccountModal
          open={showEditModal}
          account={selectedAccount}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAccount(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
      {showViewModal && selectedAccount && (
        <ViewAccountModal
          open={showViewModal}
          account={selectedAccount}
          onClose={() => {
            setShowViewModal(false);
            setSelectedAccount(null);
          }}
        />
      )}
    </div>
  );
}
