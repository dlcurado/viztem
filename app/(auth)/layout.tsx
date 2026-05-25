export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Viztem</h1>
          <p className="text-gray-500 text-sm mt-1">
            O classificado do seu condomínio
          </p>
        </div>

        {/* Conteúdo da página (login ou cadastro) */}
        {children}
      </div>
    </div>
  )
}