import React from 'react';
import { Link } from 'react-router-dom';

const ServiceUnavailablePage: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center justify-center ">
        <div className="relative z-[-1] h-80">
          <h1
            className="text-oops absolute left-1/2 m-0 -translate-x-1/2 bg-[url('@/assets/images/not-found.jpg')] 
      bg-cover bg-clip-text fill-transparent text-[230px] font-black"
          >
            Oops!
          </h1>
        </div>
        <h2 className="mt-0 text-2xl font-bold uppercase text-black">503 - Service unavailable</h2>
        <p className="mb-5 mt-0 text-sm font-normal text-black">
          Trang bạn đang tìm kiếm có thể đã bị xóa, tên trang đã được đổi hoặc tạm thời không khả dụng.        </p>
        <Link
          to={`/`}
          className="inline-block rounded-lg bg-sky-500 px-2 py-4 text-sm font-bold
      uppercase text-white no-underline shadow-sm transition hover:bg-sky-600"
        >
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
};

export default ServiceUnavailablePage;
