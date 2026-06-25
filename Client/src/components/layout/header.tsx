"use client";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-white px-6">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white"
        aria-label="Admin profile"
      >
        AD
      </div>
    </header>
  );
}
