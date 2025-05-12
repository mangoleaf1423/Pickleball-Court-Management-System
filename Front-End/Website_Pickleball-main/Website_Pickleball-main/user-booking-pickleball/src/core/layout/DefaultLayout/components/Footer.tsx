import React from 'react';
import { Link } from 'react-router-dom';

import { CURRENT_ENV } from '@/core/configs/env';
import { Image } from 'antd';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-[#016d399f] to-[#016d39] text-white py-8 px-4 text-lg">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Giới thiệu */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">GIỚI THIỆU</h3>
          <hr className='border-white' />
          <Link to="/">
                  <Image
                    src={`${CURRENT_ENV.HEADER_LOGO}`}
                    alt="Logo"
                    height={150}
                    preview={false}
                    className="cursor-pointer"
                  />
        </Link>
          <p>
            Đặt sân 247 cung cấp các tiện ích thông minh giúp cho bạn tìm sân bãi và đặt sân một cách hiệu quả nhất.
          </p>
          <div className="space-y-2">
            <a href="#" style={{color: '#EAB308'}} className="hover:underline  block">Chính sách bảo mật</a>
            <a href="#" style={{color: '#EAB308'}} className="hover:underline  block">Chính sách huỷ (đổi trả)</a>
            <a href="#" style={{color: '#EAB308'}} className="hover:underline  block">Chính sách kiếm hàng</a>
            <a href="#" style={{color: '#EAB308'}} className="hover:underline  block">Chính sách thanh toán</a>
          </div>
        </div>

        {/* Thông tin */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">THÔNG TIN</h3>
          <hr className='border-white' />
          <p></p>
          <p>MST: 0110175404</p>
          <p>Mail: contact@picklecourt.id.vn</p>
          <p>Địa chỉ: Số 3 ngõ 612/34/15 Đường La Thành, Phường Giảng Võ, Quận Ba Đình, Thành phố Hà Nội, Việt Nam</p>
          <p>Điện thoại: 0999.999.8888</p>
          <p>Giấy phép ĐKKD số 0110175404 do Sở Kế hoạch và Đầu tư thành phố Hà Nội Cấp ngày 08/11/2022.</p>
          <div className="flex space-x-4">
          <p className='text-lg font-semibold'>TIM CHÚNG TÔI</p>
            <a href="#" className="hover:text-gray-300">
              {/* Add your Facebook icon here */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm3 8h-1.35c-.59 0-.71.3-.71.64V12h2.08l-.2 2.4h-1.88v7.13h-2.58V14.4h-1.6v-2.4h1.6V8.36c0-1.92.95-3.13 3.02-3.13H15v2z"/>
              </svg>
            </a>
            <a href="#" className="hover:text-gray-300">
              {/* Add your Instagram icon here */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 3.35a3.65 3.65 0 100 7.3 3.65 3.65 0 000-7.3zM18.8 8.4a.6.6 0 11-1.2 0 .6.6 0 011.2 0zM12 15c-1.66 0-3-.34-4.2-1.12a4.4 4.4 0 018.4 0C15 14.66 13.66 15 12 15zm0 1.5c1.93 0 3.5-1.57 3.5-3.5S13.93 10 12 10 8.5 11.57 8.5 13.5 10.07 17 12 17z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Liên hệ */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">LIÊN HỆ</h3>
          <hr className='border-white' />
          <div className="bg-white p-4 rounded-md">
            <p className='text-lg text-[#016d39] font-bold'>Chăm sóc khách hàng:</p>
            <p className="text-xl text-[#016d39] font-bold">0999.999.8888</p>
            <button className="bg-yellow-500 text-white border-none px-4 py-2 rounded-md mt-2">Gọi ngay</button>
          </div>
        </div>
      </div>

      <hr className='border-white mt-8 scroll-px-32 ' />
      <div className="mt-8 text-center border-t border-[#016d39] pt-4">
        <p>© FPT University 2025. Toàn bộ bản quyền thuộc FPT University.</p>
        <div className="mt-2 space-x-4">
          <a href="#" style={{color: '#EAB308'}} className="hover:underline">Dành cho chủ sân</a>
          <a href="#" style={{color: '#EAB308'}} className="hover:underline">Điều khoản</a>
          <a href="#" style={{color: '#EAB308'}} className="hover:underline">Chính sách</a>
          <a href="#" style={{color: '#EAB308'}} className="hover:underline">Giới thiệu</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;