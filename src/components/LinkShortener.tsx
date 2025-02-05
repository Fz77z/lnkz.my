"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LinkIcon,
  ClipboardIcon,
  History,
  ExternalLink,
  Trash2,
  ChevronRight,
  Share2,
  Check,
  Laugh,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type HistoryItem = {
  originalUrl: string;
  shortUrl: string;
  createdAt: number;
};

export default function LinkShortener() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isErrorDialog, setIsErrorDialog] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem("urlHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
      // Default to hidden on mobile, expanded on desktop
      setIsHistoryExpanded(window.innerWidth >= 768);
    }

    // Update isHistoryExpanded when window is resized
    const handleResize = () => {
      setIsHistoryExpanded(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCopy = useCallback(
    (textToCopy: string) => {
      navigator.clipboard.writeText(textToCopy);
      if (textToCopy === shortUrl) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [shortUrl],
  );

  useEffect(() => {
    if (shortUrl) {
      handleCopy(shortUrl);
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [shortUrl, handleCopy]);

  const addToHistory = (originalUrl: string, shortUrl: string) => {
    const newHistory = [
      ...history,
      { originalUrl, shortUrl, createdAt: Date.now() },
    ].slice(-10); // Keep last 10 items
    setHistory(newHistory);
    localStorage.setItem("urlHistory", JSON.stringify(newHistory));
    setIsHistoryExpanded(true);
  };

  const removeFromHistory = (shortUrl: string) => {
    const newHistory = history.filter((item) => item.shortUrl !== shortUrl);
    setHistory(newHistory);
    localStorage.setItem("urlHistory", JSON.stringify(newHistory));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShortUrl("");

    try {
      // Check if trying to shorten our own shortened URL - more robust check
      if (url.includes("lnkz.my") || url.startsWith("https://lnkz.my")) {
        setIsErrorDialog(true);
        setShowDialog(true);
        setUrl(""); // Clear input
        return;
      }

      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      const data = await response.json();
      // Ensure we don't double prefix the URL
      const fullShortUrl = data.shortUrl.startsWith("https://lnkz.my/")
        ? data.shortUrl
        : `https://lnkz.my/${data.shortUrl}`;
      setShortUrl(fullShortUrl);
      addToHistory(url, fullShortUrl);
      setIsErrorDialog(false);
      setShowDialog(true);
      setUrl(""); // Clear input after successful submission
    } catch {
      setShowDialog(true);
      setIsErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Share Link",
        text: "Check out this link:",
        url: shortUrl,
      });
    } catch (err) {
      console.log("Error sharing:", err);
    }
  };

  const handleCopyFromHistory = (originalUrl: string, shortUrl: string) => {
    setShortUrl(shortUrl);
    setIsErrorDialog(false);
    setShowDialog(true);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("urlHistory");
  };

  return (
    <div className="relative flex flex-col gap-4 lg:flex-row">
      <div className="w-full lg:max-w-xl">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center rounded-md border-2 border-input bg-background focus-within:border-primary">
              <LinkIcon className="ml-2 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your long URL here"
                required
                className="w-full bg-background p-2 text-foreground placeholder-muted-foreground outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-primary py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Shortening..." : "Shorten URL"}
            </button>
          </form>
        </div>
      </div>

      <div
        className={cn(
          "w-full rounded-lg border bg-background lg:w-80 lg:rounded-none lg:border-l lg:border-t-0",
          "mt-4 lg:mt-0",
          "transform transition-transform duration-300 lg:fixed lg:right-0 lg:top-0 lg:h-full",
          "lg:overflow-hidden",
          isHistoryExpanded
            ? "lg:translate-x-0"
            : "lg:translate-x-[calc(100%-2rem)]",
        )}
      >
        <button
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className={cn(
            "absolute -left-6 hidden h-6 w-6 items-center justify-center rounded-l-md border border-r-0 bg-background hover:bg-accent/50 lg:flex",
            "top-1/2 -translate-y-1/2",
          )}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              isHistoryExpanded && "rotate-180",
            )}
          />
        </button>

        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Recent Links</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {history.length}
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[50vh] flex-1 overflow-y-auto lg:max-h-full">
            <div className="divide-y divide-border">
              {history.map((item) => (
                <div
                  key={item.shortUrl}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-1 pr-2">
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {item.originalUrl}
                    </div>
                    <a
                      href={item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {item.shortUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleCopyFromHistory(item.originalUrl, item.shortUrl)
                      }
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromHistory(item.shortUrl)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              {isErrorDialog ? "Nice Try! 😄" : "Your Shortened URL"}
            </DialogTitle>
          </DialogHeader>
          {isErrorDialog ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Laugh className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  That&apos;s Already Short!
                </p>
                <p className="text-sm text-muted-foreground">
                  You can&apos;t shorten what&apos;s already shortened.
                  That&apos;s like trying to fold an origami crane that&apos;s
                  already folded! 🦢
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center rounded-lg border bg-muted p-3">
                <div className="min-h-[20px] flex-1 overflow-x-auto">
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-foreground hover:underline"
                  >
                    {shortUrl}
                  </a>
                </div>
                <button
                  onClick={() => handleCopy(shortUrl)}
                  className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="sr-only">Copy URL</span>
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-background p-2">
                <div className="flex items-center gap-2 text-sm">
                  {copied ? (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        Copied to clipboard
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                        <Share2 className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                      <span className="text-muted-foreground">
                        Ready for sharing&nbsp;&nbsp;&nbsp;
                      </span>
                    </>
                  )}
                </div>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
