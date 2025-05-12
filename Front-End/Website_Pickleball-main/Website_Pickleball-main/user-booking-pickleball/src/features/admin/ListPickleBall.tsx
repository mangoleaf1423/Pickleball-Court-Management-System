import { ChevronLeft, ChevronRight, CircleDollarSign, Info, Map, Phone, Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CURRENT_ENV } from '@/core/configs/env';

interface Court {
    id: string;
    name: string;
    address: string;
    phone: string;
    openTime: string;
    email: string;
    link: string;
    logoUrl: string;
    active: boolean;
}

interface ApiResponse {
    page: number;
    size: number;
    totalElements: number;
    data: Court[];
}

const ListPickleBall: React.FC = () => {
    const location = useLocation();
    const { searchQuery, locationKeyword } = location.state || {};
    
    const [courts, setCourts] = useState<Court[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const itemsPerPage = 9;
    const [searchTerm, setSearchTerm] = useState(searchQuery || '');
    const [locationTerm, setLocationTerm] = useState(locationKeyword || '');
    const defaultImage = "https://mediatech.vn/assets/images/imgstd.jpg";
    const [activeCourtsCount, setActiveCourtsCount] = useState(0);

    useEffect(() => {
        if (searchQuery) {
            setSearchTerm(searchQuery);
        }
        if (locationKeyword) {
            setLocationTerm(locationKeyword);
        }
    }, [searchQuery, locationKeyword]);

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const response = await axios.get<ApiResponse>(
                    `${CURRENT_ENV.API_URL}/court/public/getAllPageable?page=${currentPage}&size=${itemsPerPage}&search=${searchTerm}&location=${locationTerm}`
                );
                setCourts(response.data.data);
                setTotalElements(response.data.totalElements);
                
                // Đếm số sân active
                const activeCount = response.data.data.filter(court => court.active).length;
                setActiveCourtsCount(activeCount);
            } catch (error) {
                console.error('Error fetching courts:', error);
            }
        };

        fetchCourts();
    }, [currentPage, searchTerm, locationTerm]);

    const totalPages = Math.ceil(totalElements / itemsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset về trang 1 khi search
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Sân Pickleball</h2>
                    <div className="flex gap-4 items-center">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm theo tên..."
                                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <button 
                                type="submit"
                                className="px-4 py-2 bg-yellow-500 text-white rounded-full border-none hover:bg-yellow-600 flex items-center gap-2"
                            >
                                <Search size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courts.map((court) => (
                        court.active && (
                        <Link
                            key={court.id}
                            to={`/pickleball/${court.id}`}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <div className="aspect-square overflow-hidden rounded-t-xl">
                                <img
                                    src={court.logoUrl || defaultImage}
                                    alt="Court"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = defaultImage;
                                    }}
                                />
                            </div>

                            <div className="p-4">
                                <div className="mb-3">
                                    <h3 className="text-lg font-semibold text-gray-800">{court.name}</h3>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <span className="material-icons text-gray-400 text-sm mr-2"><Map /></span>
                                        <p className="truncate">{court.address}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="material-icons text-gray-400 text-sm mr-2"><Phone /></span>
                                        <p>{court.phone}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="material-icons text-gray-400 text-sm mr-2"><CircleDollarSign /></span>
                                        <p>{court.openTime}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-center items-center">
                                    <div
                                        className="bg-[#EAB308] hover:bg-[#EAB308] text-white px-4 py-2 rounded-lg 
                                        flex items-center transition-colors"
                                    >
                                        <span className="material-icons mr-2 text-sm"><Info /></span>
                                        Chi tiết
                                    </div>
                                </div>
                            </div>
                        </Link>
                        ) 
                    ))}
                </div>

                <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 px-3 rounded-lg flex items-center 
              ${currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                        <span className="material-icons"><ChevronLeft /></span>
                    </button>

                    {getPageNumbers().map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center
                ${currentPage === page
                                    ? 'bg-yellow-500 text-white border-none font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 px-3 rounded-lg flex items-center 
              ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                        <span className="material-icons"><ChevronRight /></span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ListPickleBall;