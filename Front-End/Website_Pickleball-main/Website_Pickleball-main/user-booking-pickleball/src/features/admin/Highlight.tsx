import React from 'react';

const Highlight: React.FC = () => {
  const highlights = [
    {
      image: 'https://i.ibb.co/05RMPD2/cho-thue-quang-cao-san-pickleball-1-scaled.jpg',
      title: 'Sân Pickleball Cao Cấp',
      subtitle: 'Trải nghiệm đẳng cấp'
    },
    {
      image: 'https://i.ibb.co/05RMPD2/cho-thue-quang-cao-san-pickleball-1-scaled.jpg',
      title: 'Sân Pickleball Cao Cấp',
      subtitle: 'Trải nghiệm đẳng cấp'
    },
    {
      image: 'https://i.ibb.co/05RMPD2/cho-thue-quang-cao-san-pickleball-1-scaled.jpg',
      title: 'Sân Pickleball Cao Cấp',
      subtitle: 'Trải nghiệm đẳng cấp'
    },
    {
      image: 'https://i.ibb.co/05RMPD2/cho-thue-quang-cao-san-pickleball-1-scaled.jpg',
      title: 'Sân Pickleball Cao Cấp',
      subtitle: 'Trải nghiệm đẳng cấp'
    }
  ];

  return (
    <>
      <div className='flex justify-center items-center pt-10'>
        <h1 className='text-2xl font-bold'>
          Quảng cáo sân Pickleball
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 lg:p-8 max-w-7xl mx-auto">

        {highlights.map((item, index) => (
          <div
            key={index}
            className="group relative h-64 md:h-96 rounded-xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-105"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="relative h-full flex flex-col justify-end p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
              <p className="text-lg opacity-90 mb-4">{item.subtitle}</p>
              <button
                className="self-end bg-yellow-500 hover:bg-yellow-600 border-none text-white px-6 py-2 rounded-full 
                        shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                        focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Highlight;