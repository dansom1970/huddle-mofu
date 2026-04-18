export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F5F3] flex items-center justify-center">
      {children}
    </div>
  )
}
