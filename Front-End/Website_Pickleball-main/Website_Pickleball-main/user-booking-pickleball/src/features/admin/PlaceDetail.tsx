import { CURRENT_ENV } from '@/core/configs/env';
import { EnvironmentFilled, PhoneFilled, ClockCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Tabs, Carousel, Button, message, Skeleton } from 'antd';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  regularPrice: number;
  dailyPrice: number;
  studentPrice: number;
}

interface CourtPrice {
  courtId: string;
  weekdayTimeSlots: TimeSlot[];
  weekendTimeSlots: TimeSlot[];
}

interface Place {
  id: string;
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  openTime: string;
  email: string;
  link: string;
  active: boolean;
  images: string[];
}

const PlaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [courtPrice, setCourtPrice] = useState<CourtPrice | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [courtImages, setCourtImages] = useState<string[]>([]);
  const [mapImages, setMapImages] = useState<string[]>([]);

  const handleSchedule = () => {
    localStorage.removeItem('selectedDates');
    localStorage.removeItem('selectedTimeSlots');
    localStorage.removeItem('selectedCourts');
    localStorage.removeItem('selectedUserType');
    localStorage.removeItem('paymentMethod');
    localStorage.removeItem('activeDate');
    navigate(`/schedule/${id}`, { state: { courtName: place?.name } });
  };

  const handleAutoSchedule = () => {
    localStorage.removeItem('scheduleAutoState');
    navigate(`/schedule-auto/${id}`, { state: { courtName: place?.name } });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [placeResponse, priceResponse, servicesResponse, courtImagesResponse, mapImagesResponse] = await Promise.all([
          fetch(`${CURRENT_ENV.API_URL}/court/public/${id}`),
          fetch(`${CURRENT_ENV.API_URL}/court/public/court_price/getByCourtId/${id}`),
          fetch(`${CURRENT_ENV.API_URL}/court/public/getServices?courtId=${id}`),
          fetch(`${CURRENT_ENV.API_URL}/court/public/court-images/list?courtId=${id}&isMap=false`),
          fetch(`${CURRENT_ENV.API_URL}/court/public/court-images/list?courtId=${id}&isMap=true`)
        ]);

        const placeData = await placeResponse.json();
        const priceData = await priceResponse.json();
        const servicesData = await servicesResponse.json();
        const courtImagesData = await courtImagesResponse.json();
        const mapImagesData = await mapImagesResponse.json();

        if (!placeResponse.ok) throw new Error(placeData.message || 'Failed to fetch place');
        if (!priceResponse.ok) throw new Error(priceData.message || 'Failed to fetch prices');
        if (!servicesResponse.ok) throw new Error(servicesData.message || 'Failed to fetch services');

        setPlace({
          ...placeData,
          images: [
            placeData.backgroundUrl || '/default-banner.jpg'
          ]
        });
        setCourtPrice(priceData);
        setServices(servicesData);
        setCourtImages(courtImagesData.map((img: any) => img.imageUrl));
        setMapImages(mapImagesData.map((img: any) => img.imageUrl));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi lấy dữ liệu');
        message.error('Lỗi khi lấy dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const items = [
    {
      key: 'info',
      label: 'Thông tin',
      children: (
        <div className="space-y-6 text-gray-700">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ClockCircleFilled className="text-blue-500 text-lg" />
                <span>Giờ mở cửa: {place?.openTime}</span>
              </div>
              <div className="flex items-center gap-3">
                <PhoneFilled className="text-green-500 text-lg" />
                <span>{place?.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <EnvironmentFilled className="text-red-500 text-lg" />
                <span>{place?.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Bảng giá theo khung giờ</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 text-green-700">Ngày trong tuần</h4>
                <div className="grid grid-cols-1 gap-4">
                  {courtPrice?.weekdayTimeSlots.map((slot, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-green-800 text-lg">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-gray-500 text-sm mb-1">Giá khách hàng ngày</div>
                          <div className="font-bold text-green-600">{slot.dailyPrice.toLocaleString()}đ</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-gray-500 text-sm mb-1">Giá sinh viên</div>
                          <div className="font-bold text-green-600">{slot.studentPrice.toLocaleString()}đ</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-green-700">Ngày cuối tuần</h4>
                <div className="grid grid-cols-1 gap-4">
                  {courtPrice?.weekendTimeSlots.map((slot, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold text-green-800 text-lg">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-gray-500 text-sm mb-1">Giá khách hàng ngày</div>
                          <div className="font-bold text-green-600">{slot.dailyPrice.toLocaleString()}đ</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-gray-500 text-sm mb-1">Giá sinh viên</div>
                          <div className="font-bold text-green-600">{slot.studentPrice.toLocaleString()}đ</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Thông tin liên hệ</h3>
            <div className="space-y-4">
              <p><strong>Email:</strong> {place?.email}</p>
              <p><strong>Website:</strong> <a href={place?.link} target="_blank" rel="noopener noreferrer">{place?.link}</a></p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'services',
      label: 'Dịch vụ',
      children: (
        <div className="space-y-6 text-gray-700">
          {Object.entries(services.reduce((acc, service) => {
            if (!acc[service.category]) acc[service.category] = [];
            acc[service.category].push(service);
            return acc;
          }, {} as Record<string, any[]>)).map(([category, items]) => (
            <div key={category} className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((service, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-green-100">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/3 h-32 rounded-lg overflow-hidden">
                        <img 
                          src={service.imageUrl || "https://mediatech.vn/assets/images/imgstd.jpg"} 
                          alt={service.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://mediatech.vn/assets/images/imgstd.jpg";
                          }}
                        />
                      </div>
                      <div className="w-full md:w-2/3">
                        <div className="font-semibold text-green-800">{service.name}</div>
                        <div className="text-2xl font-bold text-green-600 my-2">
                          {service.price.toLocaleString()}đ/{service.unit}
                        </div>
                        <p className="text-gray-500 text-sm">{service.description}</p>
                        {service.quantity && (
                          <p className="text-gray-500 text-sm mt-1">Còn lại: {service.quantity} {service.unit}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
              Hiện tại chưa có dịch vụ nào
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'gallery',
      label: 'Hình ảnh',
      children: (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Sơ đồ sân</h3>
            <Carousel autoplay dots={{ className: 'custom-dots' }}>
              {mapImages.length > 0 ? mapImages.map((img, index) => (
                <div key={index} className="h-96">
                  <img src={img} alt={`Map ${index}`} className="w-full h-full object-cover" />
                </div>
              )) : (
                <div className="h-96">
                  <img src="https://mediatech.vn/assets/images/imgstd.jpg" alt="Default Map" className="w-full h-full object-cover" />
                </div>
              )}
            </Carousel>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Hình ảnh sân</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courtImages.length > 0 ? courtImages.map((img, index) => (
                <div key={index} className="aspect-square overflow-hidden rounded-lg">
                  <img 
                    src={img} 
                    alt={`Court ${index}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )) : (
                <div className="aspect-square overflow-hidden rounded-lg">
                  <img 
                    src="https://mediatech.vn/assets/images/imgstd.jpg" 
                    alt="Default Court" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gray-50 p-6">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-red-500 text-lg">{error || 'Place not found'}</div>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l shadow-xl pb-10">
      <div className="p-6 border-b flex items-center justify-between bg-white">
        <Button
          shape="circle"
          icon={<span className="text-xl">×</span>}
          onClick={() => navigate(-1)}
          className="shadow-sm"
        />
        <div className="flex gap-4">
          <Button
            type="primary"
            size="large"
            style={{ 
              backgroundColor: '#FFA500',
              height: '3rem',
              paddingLeft: '2rem',
              paddingRight: '2rem',
              fontWeight: 600,
              border: 'none',
              transition: 'all 0.3s'
            }}
            onClick={() => handleAutoSchedule()}
          >
            Đặt lịch cố định
          </Button>
          <Button
            type="primary"
            size="large"
            style={{ 
              backgroundColor: '#089A42FF',
              height: '3rem',
              paddingLeft: '2rem',
              paddingRight: '2rem',
              fontWeight: 600,
              border: 'none',
              transition: 'all 0.3s'
            }}
            onClick={() => handleSchedule()}
          >
            Đặt lịch hàng ngày
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="relative">
          <Carousel autoplay effect="fade" className="h-64">
            {place.images.map((img, index) => (
              <div key={index}>
                <img 
                  src={img || "https://mediatech.vn/assets/images/imgstd.jpg"} 
                  alt={`Ảnh sân ${index + 1}`} 
                  className="w-full h-64 object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://mediatech.vn/assets/images/imgstd.jpg";
                  }}
                />
              </div>
            ))}
          </Carousel>

          <div className="absolute -bottom-16 left-6">
            <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden">
              <img
                src={place.logoUrl || 'https://mediatech.vn/assets/images/imgstd.jpg'}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="pt-20 px-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{place.name}</h1>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarStyle={{ padding: '0 24px' }}
            items={items}
            className="custom-tabs"
          />
        </div>
      </div>
    </div>
  );
};

export default PlaceDetail;