
import React from 'react';

const HeroSection: React.FC = () => {
    return (
        <div className="relative bg-cover bg-center h-[600px] flex items-center justify-center text-center text-white"
            style={{ backgroundImage: `url('https://imageio.forbes.com/specials-images/imageserve/6691959fdc6bf88e35f83fd6/2022-USA-Pickleball-West-Diamond-Regional/960x0.jpg?format=jpg&width=960')` }}> {/* Replace with your image path */}

            <div className="absolute inset-0 bg-black opacity-50"></div> {/* Overlay for better text readability */}

            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">HỆ THỐNG HỖ TRỢ TÌM KIẾM SÂN BÃI NHANH</h1>
                <p className="text-lg mb-8">Dữ liệu được sân cập nhật thường xuyên giúp cho người dùng tìm được sân một cách nhanh nhất.</p>

            </div>
        </div>
    );
};

const FeaturesSection: React.FC = () => {
    return (
        <div className="bg-gray-100 py-16">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                    {/* Replace with your icon */}
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Tìm kiếm vị trí sân</h3>
                    <p className="text-gray-700">Dữ liệu sân đầu dồi dào, liên tục cập nhật, giúp bạn dễ dàng tìm kiếm theo khu vực mong muốn.</p>
                </div>

                <div>
                    {/* Replace with your icon */}
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Đặt lịch online</h3>
                    <p className="text-gray-700">Không cần đến trực tiếp, không cần gọi điện đặt lịch, bạn hoàn toàn có thể đặt sân ở bất kì đâu có internet.</p>
                </div>

                <div>
                    {/* Replace with your icon */}
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1a7 7 0 1114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Tìm đối, bắt cặp đấu</h3>
                    <p className="text-gray-700">Tìm kiếm, giao lưu các đội thi đấu thể thao, kết nối, xây dựng cộng đồng thể thao sôi nổi mạnh mẽ.</p>
                </div>
            </div>
        </div>
    );
};

const Home: React.FC = () => {
    return (
        <div>
            <HeroSection />
            <FeaturesSection />
        </div>
    );
};

export default Home;