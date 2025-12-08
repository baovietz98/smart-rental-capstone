
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
         {/* Logo or App Name */}
         <div className="text-center mb-8">
             <h1 className="text-3xl font-bold font-serif text-[#2D2D2C] mb-2">Smart Rental</h1>
             <p className="text-gray-500 font-sans">Premium Management System</p>
         </div>
         
         {children}

         <div className="text-center mt-8 text-xs text-gray-400 font-sans">
             &copy; {new Date().getFullYear()} Smart Rental Manager. All rights reserved.
         </div>
      </div>
    </div>
  );
}
