import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Employee Happiness Survey",
  description: "แบบสำรวจความสุขพนักงานและความผูกพัน ประจำปี 2569 — Food Passion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <footer style={{ padding: "24px 20px", textAlign: "center", color: "#755b47", background: "#fff7ed", borderTop: "1px solid #f3dfc6", fontSize: "14px", lineHeight: 1.9 }}>
          <div>พบปัญหาการใช้ระบบ ติดต่อ</div>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: "20px", rowGap: "4px" }}>
            <span>คุณปุ้ม <a href="tel:0623084679" style={{ color: "#a84b0b", whiteSpace: "nowrap" }}>062-3084679</a></span>
            <span>คุณต๋อม xx</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
