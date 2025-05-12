import DatsanPickleBallAbout from "./components/Common";

export default function About() {
    const description = "DatsanPickleBall là nền tảng trực tuyến hàng đầu cho việc khám phá và đặt lịch trận đấu pickleball. Đặt sân 247 cung cấp các tiện ích thông minh giúp cho bạn tìm sân bãi và đặt sân một cách hiệu quả nhất. Tối ưu hóa thời gian và công sức cho bạn."
    return (
        <div className="container mx-auto px-4 py-8 text-lg">
            <DatsanPickleBallAbout
                title="Giới thiệu"
                ratingStars={5}
                description={description}
                imageUrl="https://helio.vn/media/posts/pickleball-da-nang-236.jpg" 
            />
        </div>
    );

}
