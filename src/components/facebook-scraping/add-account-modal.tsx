"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { createAccount, type FacebookAccount } from "@/utils/api/facebookApi";
import { toast } from "sonner";

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAccountModal({ open, onClose, onSuccess }: AddAccountModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    profile_url: "",
    requires_login: false,
    facebook_email: "",
    facebook_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData({
        username: "",
        display_name: "",
        profile_url: "",
        requires_login: false,
        facebook_email: "",
        facebook_password: "",
      });
      setShowPassword(false);
    }
  }, [open]);

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
      };

      if (formData.display_name.trim()) {
        submitData.display_name = formData.display_name.trim();
        submitData.name = formData.display_name.trim();
      }
      if (formData.profile_url.trim()) {
        submitData.profile_url = formData.profile_url.trim();
      }

      // Login credentials
      submitData.requires_login = formData.requires_login;
      if (formData.requires_login) {
        if (formData.facebook_email.trim()) {
          submitData.facebook_email = formData.facebook_email.trim();
        }
        if (formData.facebook_password) {
          submitData.facebook_password_plaintext = formData.facebook_password;
        }
      }

      await createAccount(submitData);
      toast.success("Account created successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Facebook Account</h2>
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
              placeholder="Enter Facebook username or page ID"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Display Name</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="Enter display name (optional)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Profile URL</label>
            <input
              type="url"
              value={formData.profile_url}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="https://facebook.com/username (optional)"
            />
          </div>

          {/* Login Credentials Section */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Login Required</label>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, requires_login: !formData.requires_login })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.requires_login ? 'bg-primary' : 'bg-muted'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.requires_login ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Enable this if the page requires authentication to crawl private content.
            </p>

            {formData.requires_login && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Facebook Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.facebook_email}
                    onChange={(e) => setFormData({ ...formData, facebook_email: e.target.value })}
                    required={formData.requires_login}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    placeholder="your-facebook-email@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Facebook Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.facebook_password}
                      onChange={(e) => setFormData({ ...formData, facebook_password: e.target.value })}
                      required={formData.requires_login}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-10 text-sm"
                      placeholder="Enter Facebook password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Password is stored securely and used only for crawling.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
