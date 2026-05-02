"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, FileText, Image, Video, Link2, Calendar, Hash, AtSign } from "lucide-react";
import { type FacebookPost } from "@/utils/api/facebookApi";

interface ViewPostModalProps {
  open: boolean;
  post: FacebookPost;
  onClose: () => void;
}

const contentTypeIcons: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  text: { icon: FileText, label: "Text", color: "bg-gray-500" },
  photo: { icon: Image, label: "Photo", color: "bg-blue-500" },
  video: { icon: Video, label: "Video", color: "bg-red-500" },
  link: { icon: Link2, label: "Link", color: "bg-green-500" },
  event: { icon: Calendar, label: "Event", color: "bg-purple-500" },
  story: { icon: FileText, label: "Story", color: "bg-orange-500" },
};

export default function ViewPostModal({ open, post, onClose }: ViewPostModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const contentType = post.content_type || "text";
  const typeInfo = contentTypeIcons[contentType] || contentTypeIcons.text;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Post Details</h2>
            <Badge className={`${typeInfo.color} text-white flex items-center gap-1`}>
              <TypeIcon className="h-3 w-3" />
              {typeInfo.label}
            </Badge>
            {post.source && (
              <Badge variant="outline" className="text-xs">
                {post.source}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID</label>
              <p className="text-sm">{post.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account</label>
              <p className="text-sm">{post.account_username || post.account_name || `Account #${post.account}`}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Post ID</label>
              <p className="text-sm font-mono text-xs truncate">{post.post_id}</p>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-3 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{post.likes_count || 0}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{post.comments_count || 0}</p>
              <p className="text-xs text-muted-foreground">Comments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{post.shares_count || 0}</p>
              <p className="text-xs text-muted-foreground">Shares</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{post.reactions_count || 0}</p>
              <p className="text-xs text-muted-foreground">Reactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{post.views_count || 0}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Posted At</label>
              <p className="text-sm">
                {post.posted_at
                  ? new Date(post.posted_at).toLocaleString("id-ID")
                  : "-"}
                {post.posted_ago && (
                  <span className="ml-2 text-xs text-muted-foreground">({post.posted_ago})</span>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Crawled At</label>
              <p className="text-sm">
                {new Date(post.crawled_at).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Link URL */}
          {post.link_url && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Link URL</label>
              <a
                href={post.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {post.link_title || post.link_url}
                <ExternalLink className="h-3 w-3" />
              </a>
              {post.link_description && (
                <p className="text-xs text-muted-foreground mt-1">{post.link_description}</p>
              )}
            </div>
          )}

          {/* Media URLs */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Image className="h-4 w-4" />
                Media ({post.media_urls.length})
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {post.media_urls.slice(0, 6).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square overflow-hidden rounded-lg border border-border hover:opacity-80"
                  >
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Hashtags
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Mentions */}
          {post.mentions && post.mentions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AtSign className="h-4 w-4" />
                Mentions
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {post.mentions.map((mention, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    @{mention}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mt-4 border-t pt-4">
            <label className="text-sm font-medium text-muted-foreground">Content</label>
            <div className="mt-2 rounded-md border border-border bg-muted/50 p-4">
              <p className="text-sm whitespace-pre-wrap">{post.content || "No content"}</p>
            </div>
          </div>

          {/* Validation Status */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Validated: {post.validated ? "✅ Yes" : "❌ No"}
            </span>
            {post.duplicate_of && (
              <span className="text-orange-600">
                Duplicate of Post #{post.duplicate_of}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
