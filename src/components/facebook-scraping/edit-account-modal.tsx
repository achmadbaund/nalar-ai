"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { updateAccount, type FacebookAccount } from "@/utils/api/facebookApi";
import { toast } from "sonner";

interface EditAccountModalProps {
  open: boolean;
  account: FacebookAccount;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAccountModal({
  open,
  account,
  onClose,
  onSuccess,
}: EditAccountModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    profile_url: "",
    status: "active" as "active" | "inactive",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && account) {
      setFormData({
        username: account.username || "",
        display_name: account.display_name || "",
        profile_url: account.profile_url || "",
        status: account.status === "active" ? "active" : "inactive",
      });
    }
  }, [open, account]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: any = {
        username: formData.username.trim(),
        status: formData.status,
      };

      if (formData.display_name.trim()) {
        submitData.display_name = formData.display_name.trim();
      }
      if (formData.profile_url.trim()) {
        submitData.profile_url = formData.profile_url.trim();
      }

      await updateAccount(account.id, submitData);
      toast.success("Account updated successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update account");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Facebook Account</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Display Name</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Profile URL</label>
            <input
              type="url"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Account"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
