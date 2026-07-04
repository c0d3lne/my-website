import type { ReactNode } from "react";
import AdminNav from "./_components/AdminNav";

export const metadata = { title: "GB Detailing Admin" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <AdminNav />
      {children}
    </div>
  );
}
