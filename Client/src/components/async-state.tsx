// Reusable async-state visual components for data-fetching pages.
// Provides four primitives:
// 1. LoadingState — pulsing spinner with configurable message
// 2. ErrorState — error icon + message + optional retry button
// 3. NotFoundState — 404-style display with optional action CTA
// 4. AsyncWrapper — a small state machine that picks one of the above
//    or renders children based on isLoading/error/onRetry props.
//
// These are used on the dashboard and students list pages to keep loading,
// error, and empty states visually consistent across the app.

"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, FileQuestion, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AsyncStateProps = {
  className?: string;
};

type LoadingStateProps = AsyncStateProps & {
  message?: string;
};

export function LoadingState({ className, message }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-20",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium">Loading...</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {message || "Please wait while we fetch the data."}
        </p>
      </div>
    </motion.div>
  );
}

type ErrorStateProps = AsyncStateProps & {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  className,
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-20",
        className,
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium">Error</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

type NotFoundStateProps = AsyncStateProps & {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function NotFoundState({
  className,
  title = "Page Not Found",
  message = "The page you are looking for does not exist or has been moved.",
  action,
}: NotFoundStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-20",
        className,
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-lg font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {action && (
        <Button variant="default" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

type AsyncWrapperProps = {
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
};

export function AsyncWrapper({
  isLoading,
  error,
  onRetry,
  children,
  loadingMessage,
  errorMessage,
}: AsyncWrapperProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error) {
    return (
      <ErrorState
        message={errorMessage || error}
        onRetry={onRetry}
      />
    );
  }

  return <>{children}</>;
}
