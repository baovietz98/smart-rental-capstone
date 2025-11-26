import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-black">
      {/* Navbar */}
      <nav className="w-full border-b-2 border-black bg-white px-8 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-full"></div>
          <span className="font-bold text-2xl tracking-tight">SmartRental</span>
        </div>
        <div className="flex gap-8 font-bold text-xl hidden md:flex">
          <a href="#" className="hover:underline decoration-4 underline-offset-4 decoration-[#FF90E8] transition-all">Features</a>
          <a href="#" className="hover:underline decoration-4 underline-offset-4 decoration-[#FF90E8] transition-all">Pricing</a>
          <a href="#" className="hover:underline decoration-4 underline-offset-4 decoration-[#FF90E8] transition-all">Blog</a>
        </div>
        <div className="flex gap-4">
          <button className="gumroad-btn-secondary text-sm px-6 py-2">Login</button>
          <button className="gumroad-btn-primary text-sm px-6 py-2">Start Selling</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <div>
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] mb-8">
              Sell your <br/>
              <span className="bg-[#FF90E8] px-2">rooms</span> <br/>
              online.
            </h1>
            <p className="text-xl md:text-2xl mb-10 leading-relaxed border-l-4 border-black pl-6 font-medium">
              The platform for landlords who want to focus on their tenants, not their spreadsheets. 
              Simple, powerful, and fun.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <Link href="/buildings">
                <button className="gumroad-btn-primary text-xl">Start managing</button>
              </Link>
              <button className="gumroad-btn-secondary text-xl">View demo</button>
            </div>
          </div>
          <div className="gumroad-card bg-[#FFC900] min-h-[400px] flex items-center justify-center rotate-2 hover:rotate-0 transition-transform">
             <div className="text-center">
               <div className="text-9xl font-bold mb-4">98%</div>
               <div className="text-2xl font-bold bg-white border-2 border-black inline-block px-4 py-1 shadow-[4px_4px_0px_#000]">Occupancy Rate</div>
             </div>
          </div>
        </div>

        {/* Dashboard Preview (Bento-ish but Gumroad style) */}
        <div className="border-t-4 border-black pt-20">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-5xl font-bold">Your Dashboard</h2>
            <div className="gumroad-badge text-lg rotate-[-2deg]">Live Data</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="gumroad-card bg-white">
              <h3 className="font-bold text-xl mb-2">Total Revenue</h3>
              <p className="text-6xl font-bold mb-4">$24.5k</p>
              <div className="w-full bg-black h-4 border-2 border-black relative">
                <div className="absolute top-0 left-0 h-full bg-[#FF90E8] w-[75%]"></div>
              </div>
              <p className="mt-2 text-sm font-bold text-gray-500">Target: $30k</p>
            </div>

            {/* Card 2 */}
            <div className="gumroad-card bg-[#E0E0E0]">
              <h3 className="font-bold text-xl mb-2">Active Issues</h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-6xl font-bold">3</span>
                <span className="bg-red-500 text-white border-2 border-black px-2 py-1 font-bold text-xs shadow-[2px_2px_0px_#000]">URGENT</span>
              </div>
              <p className="leading-tight font-medium">
                1. Broken AC (Room 101)<br/>
                2. Water leak (Room 204)<br/>
                3. Wifi slow (Room 305)
              </p>
            </div>

            {/* Card 3 */}
            <div className="gumroad-card bg-[#FF90E8] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xl mb-2">New Tenant?</h3>
                <p className="font-medium mb-6">Create a digital contract in seconds.</p>
              </div>
              <button className="gumroad-btn-secondary w-full">
                + Create Contract
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
