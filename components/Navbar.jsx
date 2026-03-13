'use client'
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import CurrencySelector from "./CurrencySelector";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const cartCount = useSelector(state => state.cart.totalItems)

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
    }

    return (
        <nav className="relative bg-white dark:bg-gray-800 transition-colors duration-200">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4  transition-all">

                    <Link href="/" className="relative text-4xl font-semibold text-slate-700 dark:text-slate-200">
                        <span className="text-green-600 dark:text-green-400">Soko</span>Mtaani<span className="text-green-600 dark:text-green-400 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-orange-500">
                            EA
                        </p>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600 dark:text-slate-300">
                        <Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Home</Link>
                        <Link href="/shop" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Shop</Link>
                        <Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">About</Link>
                        <Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Contact</Link>

                        <form onSubmit={handleSearch} className="hidden xl:flex items-center w-xs text-sm gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-full">
                            <Search size={18} className="text-slate-600 dark:text-slate-300" />
                            <input className="w-full bg-transparent outline-none placeholder-slate-600 dark:placeholder-slate-300" type="text" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} required />
                        </form>

                        <CurrencySelector />
                        <ThemeToggle />

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            <ShoppingCart size={18} />
                            Cart
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 dark:bg-slate-700 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                        <button className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full">
                            Login
                        </button>

                    </div>

                    {/* Mobile User Button  */}
                    <div className="sm:hidden">
                        <button className="px-7 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full">
                            Login
                        </button>
                    </div>
                </div>
            </div>
            <hr className="border-gray-300 dark:border-gray-600" />
        </nav>
    )
}

export default Navbar