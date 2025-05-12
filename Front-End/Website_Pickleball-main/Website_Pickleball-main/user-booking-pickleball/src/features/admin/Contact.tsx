export default function Contact() {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Liên Hệ Với Chúng Tôi</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Phần thông tin & Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Thông Tin Liên Hệ</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPinIcon className="h-6 w-6 text-yellow-500 mr-3" />
                    <p className="text-gray-600">123 Đường Pickleball, Quận 1, TP.HCM</p>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-6 w-6 text-yellow-500 mr-3" />
                    <p className="text-gray-600">(+84) 123 456 789</p>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-6 w-6 text-yellow-500 mr-3" />
                    <p className="text-gray-600">info@pickleballvn.com</p>
                  </div>
                </div>
              </div>
  
              <form className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2">Họ và Tên</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Số Điện Thoại</label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="0123 456 789"
                    />
                  </div>
                </div>
  
                <div>
                  <label className="block text-gray-700 mb-2">Nội Dung</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Nhập nội dung liên hệ..."
                  ></textarea>
                </div>
  
                <button 
                  type="submit"
                  className="w-full bg-yellow-500 border-none hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  Gửi Liên Hệ
                </button>
              </form>
            </div>
  
            {/* Phần Bản Đồ */}
            <div className="rounded-2xl overflow-hidden shadow-xl h-[600px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.632245143591!2d106.6980363152603!3d10.762733992330257!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3a7d261b27%3A0x1bdf3a7e1b9c0b0d!2sLandmark%2081!5e0!3m2!1sen!2s!4v162987654321!5m2!1sen!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="rounded-2xl"
              ></iframe>
            </div>
          </div>
  
          {/* Social Links */}
          <div className="flex justify-center space-x-6 mt-12">
            <a href="#" className="text-gray-600 hover:text-yellow-500 transition-colors">
              <FacebookIcon className="h-8 w-8" />
            </a>
            <a href="#" className="text-gray-600 hover:text-yellow-500 transition-colors">
              <InstagramIcon className="h-8 w-8" />
            </a>
            <a href="#" className="text-gray-600 hover:text-yellow-500 transition-colors">
              <YoutubeIcon className="h-8 w-8" />
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Các icons có thể import từ thư viện hoặc tự tạo
  function MapPinIcon(props: any) {
    return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  
  function PhoneIcon(props: any) {
    return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    )
  }
  
  function EnvelopeIcon(props: any) {
    return (
      <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  }
  
  function FacebookIcon(props: any) {
    return (
      <svg {...props} fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  }
  
  function InstagramIcon(props: any) {
    return (
      <svg {...props} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16 .162a4.162 4.162 0 100-8.324 4.162 4.162 0 000 8.324zm6.406-10.406a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
      </svg>
    )
  }
  
  function YoutubeIcon(props: any) {
    return (
      <svg {...props} fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.003 3.003 0 00-2.11-2.11C19.5 4 12 4 12 4s-7.5 0-9.388.076A3.003 3.003 0 00.502 6.186 30.007 30.007 0 000 12c0 1.5.5 5.5 2.112 6.924a3.003 3.003 0 002.11 2.11C4.5 20 12 20 12 20s7.5 0 9.388-.076a3.003 3.003 0 002.11-2.11C23.5 17.5 24 13.5 24 12c0-1.5-.5-5.5-2.112-6.924zM9.545 15.545V8.455l6.182 3.545-6.182 3.545z" />
      </svg>
    )
  }