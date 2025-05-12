import React, { useState, useEffect, useMemo } from "react";
import { Button, DatePicker, Modal, Radio, Empty, Tabs, Badge } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeftOutlined, CalendarOutlined } from "@ant-design/icons";
import axios from "axios";
import LoadingPage from "@/core/components/LoadingPage";
import { CURRENT_ENV } from "@/core/configs/env";
import { useApp } from "@/store";
import { io, Socket } from "socket.io-client";

interface TimeSlot {
    id?: string;
    startTime: string;
    endTime: string;
    dailyPrice: number;
    studentPrice: number;
    status?: string;
}

interface Court {
    courtSlotId: string;
    courtSlotName: string;
    bookingSlots: TimeSlot[];
}

interface SelectedTimeSlot extends TimeSlot {
    courtSlotId: string;
    courtSlotName: string;
    bookingDate: string;
}

interface PriceCalculation {
    totalPrice: number;
    paymentAmount: number;
    depositAmount: number;
}

interface DateCourtsData {
    [date: string]: Court[];
}

const LOCAL_STORAGE_KEYS = {
    SELECTED_DATES: 'selectedDates',
    SELECTED_TIME_SLOTS: 'selectedTimeSlots',
    SELECTED_COURTS: 'selectedCourts',
    SELECTED_USER_TYPE: 'selectedUserType',
    PAYMENT_METHOD: 'paymentMethod',
    ACTIVE_DATE: 'activeDate'
};

const ScheduleGrid: React.FC = () => {
    const { id, orderId } = useParams();
    const location = useLocation();
    const courtName = location.state?.courtName || "";
    const navigate = useNavigate();
    const { user } = useApp();
    
    // State management
    const [loading, setLoading] = useState(true);
    const [selectedDates, setSelectedDates] = useState<Dayjs[]>(() => {
        const savedDates = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_DATES);
        return savedDates ? JSON.parse(savedDates).map((date: string) => dayjs(date)) : [dayjs()];
    });
    const [activeDate, setActiveDate] = useState<Dayjs>(() => {
        const savedActiveDate = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_DATE);
        return savedActiveDate ? dayjs(savedActiveDate) : dayjs();
    });
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<SelectedTimeSlot[]>(() => {
        const savedSlots = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_TIME_SLOTS);
        return savedSlots ? JSON.parse(savedSlots) : [];
    });
    const [selectedCourts, setSelectedCourts] = useState<{[date: string]: Court[]}>(() => {
        const savedCourts = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_COURTS);
        return savedCourts ? JSON.parse(savedCourts) : {};
    });
    const [selectedUserType, setSelectedUserType] = useState<'student' | 'daily' | null>(() => {
        const savedUserType = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_USER_TYPE);
        return savedUserType as 'student' | 'daily' | null;
    });
    const [paymentMethod, setPaymentMethod] = useState<'full' | 'deposit'>(() => {
        const savedPaymentMethod = localStorage.getItem(LOCAL_STORAGE_KEYS.PAYMENT_METHOD);
        return (savedPaymentMethod as 'full' | 'deposit') || 'full';
    });
    
    const [existingOrder, setExistingOrder] = useState<any>(null);
    const [isUserTypeModalVisible, setIsUserTypeModalVisible] = useState(false);
    const [courtsData, setCourtsData] = useState<DateCourtsData>({});
    const [lockedSlots, setLockedSlots] = useState<{[key: string]: boolean}>({});
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isAddingDate, setIsAddingDate] = useState(false);

    // Helper function to clear localStorage
    const clearLocalStorage = () => {
        Object.values(LOCAL_STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        setSelectedDates([dayjs()]);
        setActiveDate(dayjs());
        setSelectedTimeSlots([]);
        setSelectedCourts({});
        setSelectedUserType(null);
        setPaymentMethod('full');
    };

    // Event handlers
    const handleAddDate = (date: Dayjs | null) => {
        if (!date) {
            // Nếu không chọn ngày thì mặc định chọn ngày hiện tại
            date = dayjs();
        }
        
        // Check if date already exists
        if (selectedDates.some(d => d.format('YYYY-MM-DD') === date.format('YYYY-MM-DD'))) {
            setActiveDate(date);
            setIsAddingDate(false);
            return;
        }
        
        setSelectedDates(prev => [...prev, date]);
        setActiveDate(date);
        setIsAddingDate(false);
        
        // Save the selected dates to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_DATES, JSON.stringify([...selectedDates, date].map(d => d.format())));
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_DATE, date.format());
    };

    const handleRemoveDate = (dateToRemove: Dayjs) => {
        const updatedDates = selectedDates.filter(
            date => date.format('YYYY-MM-DD') !== dateToRemove.format('YYYY-MM-DD')
        );
        
        if (updatedDates.length === 0) {
            // If removing the last date, add today's date
            updatedDates.push(dayjs());
        }
        
        setSelectedDates(updatedDates);
        
        // If active date is being removed, set active date to the first date in the list
        if (activeDate.format('YYYY-MM-DD') === dateToRemove.format('YYYY-MM-DD')) {
            setActiveDate(updatedDates[0]);
        }
        
        // Remove all time slots for this date
        setSelectedTimeSlots(prev => 
            prev.filter(slot => slot.bookingDate !== dateToRemove.format('YYYY-MM-DD'))
        );
        
        // Remove selected courts for this date
        const updatedCourts = { ...selectedCourts };
        delete updatedCourts[dateToRemove.format('YYYY-MM-DD')];
        setSelectedCourts(updatedCourts);
        
        // Update localStorage
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_DATES, JSON.stringify(updatedDates.map(d => d.format())));
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_DATE, updatedDates[0].format());
    };

    const handleSelectCourt = (courtId: string) => {
        const activeDateStr = activeDate.format('YYYY-MM-DD');
        const court = courtsData[activeDateStr]?.find(c => c.courtSlotId === courtId);
        
        if (!court) return;
        
        const updatedCourts = { ...selectedCourts };
        
        if (!updatedCourts[activeDateStr]) {
            updatedCourts[activeDateStr] = [];
        }
        
        const isCourtSelected = updatedCourts[activeDateStr].some(c => c.courtSlotId === courtId);
        
        if (isCourtSelected) {
            updatedCourts[activeDateStr] = updatedCourts[activeDateStr].filter(c => c.courtSlotId !== courtId);
            
            // Also remove any time slots for this court on this date
            setSelectedTimeSlots(prev => 
                prev.filter(slot => !(
                    slot.courtSlotId === courtId && 
                    slot.bookingDate === activeDateStr
                ))
            );
        } else {
            updatedCourts[activeDateStr] = [...updatedCourts[activeDateStr], court];
        }
        
        setSelectedCourts(updatedCourts);
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_COURTS, JSON.stringify(updatedCourts));
    };

    const handleSelectTimeSlot = (slot: TimeSlot, courtId: string) => {
        const activeDateStr = activeDate.format('YYYY-MM-DD');
        const isSlotLocked = lockedSlots[`${courtId}-${slot.startTime}-${activeDateStr}`];
        const court = courtsData[activeDateStr]?.find(c => c.courtSlotId === courtId);
        
        if (isSlotLocked || slot.status === "LOCKED" || slot.status === "BOOKED" || !court) return;
        
        const isAlreadySelected = selectedTimeSlots.some(
            selectedSlot => selectedSlot.startTime === slot.startTime && 
                          selectedSlot.bookingDate === activeDateStr &&
                          selectedSlot.courtSlotId === courtId
        );

        const newSlot: SelectedTimeSlot = {
            ...slot,
            courtSlotId: court.courtSlotId,
            courtSlotName: court.courtSlotName,
            bookingDate: activeDateStr
        };

        setSelectedTimeSlots(prev => 
            isAlreadySelected 
                ? prev.filter(s => !(
                    s.startTime === slot.startTime && 
                    s.bookingDate === activeDateStr &&
                    s.courtSlotId === courtId
                ))
                : [...prev, newSlot]
        );
    };

    const handleUserTypeConfirm = () => {
        if (selectedTimeSlots.length === 0) return;
        
        // Automatically determine user type based on roles
        let userType: 'student' | 'daily' = 'daily';
        
        if (user?.result.user.roles.some(role => role.name === "STUDENT")) {
            userType = 'student';
        }
        
        setSelectedUserType(userType);
        setIsUserTypeModalVisible(false);
        
        const orderDetails = selectedTimeSlots.reduce((acc: any[], slot) => {
            const existingDate = acc.find(d => d.bookingDate === slot.bookingDate);
            if (existingDate) {
                existingDate.bookingSlots.push({
                    courtSlotId: slot.courtSlotId,
                    courtSlotName: slot.courtSlotName,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    price: slot[`${userType}Price`]
                });
            } else {
                acc.push({
                    bookingDate: slot.bookingDate,
                    bookingSlots: [{
                        courtSlotId: slot.courtSlotId,
                        courtSlotName: slot.courtSlotName,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        price: slot[`${userType}Price`]
                    }]
                });
            }
            return acc;
        }, []);

        navigate(`/checkout`, { 
            state: { 
                orderDetails,
                selectedUserType: userType,
                selectedTimeSlots,
                id,
                orderId,
                selectedCourts,
                totalPrice: priceInfo.totalPrice,
                paymentAmount: priceInfo.paymentAmount,
                depositAmount: priceInfo.depositAmount,
                paymentMethod,
                existingOrder,
                courtName
            } 
        });
    };

    // Calculate total price based on selections
    const calculateTotalPrice = (): PriceCalculation => {
        if (selectedTimeSlots.length === 0) {
            return { totalPrice: 0, paymentAmount: 0, depositAmount: 0 };
        }
        
        // Determine user type based on roles
        let userType: 'student' | 'daily' = 'daily';
        
        if (user?.result.user.roles.some(role => role.name === "STUDENT")) {
            userType = 'student';
        }
        
        const basePrice = selectedTimeSlots.reduce((total, slot) => {
            switch(userType) {
                case 'student': return total + slot.studentPrice;
                case 'daily': return total + slot.dailyPrice;
                default: return total;
            }
        }, 0);

        let paymentAmount = basePrice;
        let depositAmount = 0;

        // Set payment method based on the number of selected time slots
        if (selectedTimeSlots.length === 1) {
            setPaymentMethod('full');
        }

        if (paymentMethod === 'deposit') {
            // Sort slots by price from lowest to highest
            const sortedSlots = [...selectedTimeSlots].sort((a, b) => {
                const priceA = userType === 'student' ? a.studentPrice : a.dailyPrice;
                const priceB = userType === 'student' ? b.studentPrice : b.dailyPrice;
                return priceA - priceB;
            });
            
            let depositSlotCount = 0;
            
            // Determine number of slots to deposit based on total slot count
            if (selectedTimeSlots.length >= 2 && selectedTimeSlots.length <= 3) {
                depositSlotCount = 1;
            } else if (selectedTimeSlots.length >= 4 && selectedTimeSlots.length <= 6) {
                depositSlotCount = 2;
            } else if (selectedTimeSlots.length >= 7 && selectedTimeSlots.length <= 9) {
                depositSlotCount = 3;
            }
            
            // Calculate deposit amount based on the lowest priced slots
            if (depositSlotCount > 0) {
                depositAmount = sortedSlots.slice(0, depositSlotCount).reduce((total, slot) => {
                    return total + (userType === 'student' ? slot.studentPrice : slot.dailyPrice);
                }, 0);
                paymentAmount = depositAmount;
            }
        } else if (paymentMethod === 'full') {
            // Tìm giá cọc nhỏ nhất trong các sân đã chọn
            const minDepositPrice = Math.min(...selectedTimeSlots.map(slot => 
                userType === 'student' ? slot.studentPrice : slot.dailyPrice
            ));
            
            // Trong trường hợp thanh toán toàn bộ, depositAmount = tổng tiền - cọc nhỏ nhất
            depositAmount = basePrice - minDepositPrice;
        }

        if (existingOrder && ['Đặt lịch thành công', 'Đã hoàn thành'].includes(existingOrder.orderStatus)) {
            const previousPayment = existingOrder.paymentAmount || 0;
            paymentAmount = paymentAmount > previousPayment 
                ? paymentAmount - previousPayment 
                : previousPayment - paymentAmount;
        }

        // Assign paymentAmount to depositAmount if depositAmount is 0
        if (depositAmount === 0) {
            depositAmount = paymentAmount;
        }

        return {
            totalPrice: basePrice,
            paymentAmount: paymentMethod === 'full' ? basePrice : paymentAmount,
            depositAmount
        };
    };

    // Memoized price calculation
    const priceInfo = useMemo(() => calculateTotalPrice(), [
        selectedTimeSlots, 
        paymentMethod, 
        existingOrder,
        user
    ]);

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io("wss://www.picklecourt.id.vn");
        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);

    // Listen for slot status updates
    useEffect(() => {
        if (!socket) return;

        const handleSlotStatusUpdate = (data: { courtId: string, date: string, startTime: string, status: string }) => {
            const { courtId, date, startTime, status } = data;
            
            // Update courtsData with the new slot status
            setCourtsData(prevCourtsData => {
                const updatedCourtsData = { ...prevCourtsData };
                
                if (updatedCourtsData[date]) {
                    updatedCourtsData[date] = updatedCourtsData[date].map(court => {
                        if (court.courtSlotId === courtId) {
                            const updatedSlots = court.bookingSlots.map(slot => {
                                if (slot.startTime === startTime) {
                                    return { ...slot, status };
                                }
                                return slot;
                            });
                            return { ...court, bookingSlots: updatedSlots };
                        }
                        return court;
                    });
                }
                
                return updatedCourtsData;
            });

            // Update lockedSlots state
            if (status === "LOCKED") {
                setLockedSlots(prev => ({
                    ...prev,
                    [`${courtId}-${startTime}-${date}`]: true
                }));

                // Remove from selected slots if it was selected
                setSelectedTimeSlots(prev => 
                    prev.filter(slot => !(
                        slot.startTime === startTime && 
                        slot.bookingDate === date &&
                        slot.courtSlotId === courtId
                    ))
                );
            } else if (status === "AVAILABLE") {
                setLockedSlots(prev => {
                    const newLockedSlots = { ...prev };
                    delete newLockedSlots[`${courtId}-${startTime}-${date}`];
                    return newLockedSlots;
                });
            }
        };

        socket.on('slotStatusUpdate', handleSlotStatusUpdate);

        return () => {
            socket.off('slotStatusUpdate', handleSlotStatusUpdate);
        };
    }, [socket]);

    // Fetch existing order if orderId is provided
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            
            try {
                const response = await axios.get(`${CURRENT_ENV.API_URL}/identity/public/getOrderById`, {
                    params: { orderId }
                });
                console.log(response.data);
                const orderData = response.data;
                setExistingOrder(orderData);
                
                // Set the selected dates from the order
                if (orderData.orderDetails && orderData.orderDetails.length > 0) {
                    const orderDates = [...new Set(orderData.orderDetails.map((detail: any) => detail.bookingDate))] as string[];
                    const dayJsDates = orderDates.map((date: string) => dayjs(date));
                    setSelectedDates(dayJsDates);
                    setActiveDate(dayJsDates[0]);
                    
                    localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_DATES, JSON.stringify(orderDates));
                    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_DATE, dayJsDates[0].format());
                }
                
                // Set selected courts and time slots from the order
                if (orderData.orderDetails && orderData.orderDetails.length > 0) {
                    const newSelectedCourts: {[date: string]: Court[]} = {};
                    const newSelectedTimeSlots: SelectedTimeSlot[] = [];
                    
                    orderData.orderDetails.forEach((detail: any) => {
                        const date = detail.bookingDate;
                        
                        if (!newSelectedCourts[date]) {
                            newSelectedCourts[date] = [];
                        }
                        
                        // Find the court in courtsData
                        const court = courtsData[date]?.find((c: Court) => c.courtSlotId === detail.courtId);
                        
                        if (court && !newSelectedCourts[date].some(c => c.courtSlotId === court.courtSlotId)) {
                            newSelectedCourts[date].push(court);
                        }
                        
                        // Add time slots
                        (detail.bookingDates || []).forEach((bookingDate: string) => {
                            newSelectedTimeSlots.push({
                                courtSlotId: detail.courtId,
                                courtSlotName: detail.courtSlotName,
                                startTime: detail.startTime,
                                endTime: detail.endTime,
                                bookingDate,
                                dailyPrice: detail.dailyPrice,
                                studentPrice: detail.studentPrice
                            });
                        });
                    });
                    
                    setSelectedCourts(newSelectedCourts);
                    setSelectedTimeSlots(newSelectedTimeSlots);
                    clearLocalStorage();
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            }
        };

        if (orderId && Object.keys(courtsData).length > 0) {
            fetchOrder();
        }
    }, [orderId]);

    // Fetch courts data for all selected dates
    useEffect(() => {
        const fetchCourtsForAllDates = async () => {
            setLoading(true);

            try {
                const newCourtsData: DateCourtsData = {};

                // Fetch data for each selected date (nếu date không hợp lệ thì dùng ngày hiện tại)
                for (const date of selectedDates) {
                    let dateObj = dayjs(date);
                    if (!dateObj.isValid()) {
                        console.warn(`Ngày không hợp lệ: ${date}, sử dụng ngày hiện tại.`);
                        dateObj = dayjs();
                    }
                    const dateStr = dateObj.format('YYYY-MM-DD');

                    // Skip nếu đã có data cho ngày này
                    if (courtsData[dateStr] && courtsData[dateStr].length > 0) {
                        newCourtsData[dateStr] = courtsData[dateStr];
                        continue;
                    }

                    const response = await axios.get(`${CURRENT_ENV.API_URL}/court/public/booking_slot`, {
                        params: {
                            courtId: id,
                            dateBooking: dateStr
                        }
                    });

                    newCourtsData[dateStr] = response.data;

                    // Khởi tạo lockedSlots cho ngày này
                    response.data.forEach((court: Court) => {
                        court.bookingSlots.forEach(slot => {
                            if (slot.status === "LOCKED") {
                                setLockedSlots(prev => ({
                                    ...prev,
                                    [`${court.courtSlotId}-${slot.startTime}-${dateStr}`]: true
                                }));
                            }
                        });
                    });
                }

                setCourtsData(prevData => ({ ...prevData, ...newCourtsData }));

                // Cập nhật lại selectedCourts chỉ bao gồm courts tồn tại trong dữ liệu mới
                const updatedSelectedCourts = { ...selectedCourts };
                for (const dateStr in updatedSelectedCourts) {
                    if (newCourtsData[dateStr]) {
                        updatedSelectedCourts[dateStr] = updatedSelectedCourts[dateStr].filter(court =>
                            newCourtsData[dateStr].some((newCourt: Court) => newCourt.courtSlotId === court.courtSlotId)
                        );
                    }
                }
                setSelectedCourts(updatedSelectedCourts);

            } catch (error) {
                console.error("Lỗi khi lấy courts:", error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedDates.length > 0) {
            fetchCourtsForAllDates();
        }
    }, [selectedDates, id]);

    // Save selections to localStorage
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_DATES, JSON.stringify(selectedDates.map(d => d.format())));
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_DATE, activeDate.format());
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_TIME_SLOTS, JSON.stringify(selectedTimeSlots));
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_COURTS, JSON.stringify(selectedCourts));
        localStorage.setItem(LOCAL_STORAGE_KEYS.PAYMENT_METHOD, paymentMethod);
        if (selectedUserType) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_USER_TYPE, selectedUserType);
        }
    }, [selectedDates, activeDate, selectedTimeSlots, selectedCourts, selectedUserType, paymentMethod]);

    // Determine user type based on roles for display purposes
    const getUserType = (): 'student' | 'daily' => {
        if (user?.result.user.roles.some(role => role.name === "STUDENT")) {
            return 'student';
        }
        return 'daily';
    };

    const userType = getUserType();

    // Get count of selected slots for each date
    const getSelectedSlotsCountByDate = (date: string) => {
        return selectedTimeSlots.filter(slot => slot.bookingDate === date).length;
    };

    if (loading) {
        return <LoadingPage />;
    }

    return (
        <div className="p-6 bg-gradient-to-b from-green-800 to-green-400 min-h-screen flex flex-col text-[16px]">
            <div className="bg-green-800 text-white p-4 rounded-md shadow-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Button
                            type="text"
                            onClick={() => navigate(-1)}
                            icon={<ArrowLeftOutlined className="text-xl text-white" />}
                            className="flex items-center justify-center"
                        />
                        <h2 className="text-lg font-bold">Đặt lịch hàng ngày</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAddingDate ? (
                            <DatePicker
                                value={null}
                                onChange={handleAddDate}
                                format="DD/MM/YYYY"
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                                open={true}
                                onOpenChange={(open) => {
                                    if (!open) setIsAddingDate(false);
                                }}
                            />
                        ) : (
                            <Button 
                                type="primary" 
                                icon={<CalendarOutlined />}
                                onClick={() => setIsAddingDate(true)}
                            >
                                Thêm ngày
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-3 p-2 bg-green-100 text-green-900 text-sm rounded-md">
                    <span className="text-orange-500 font-semibold">Lưu ý:</span> Bạn đang thay đổi lịch đặt cho đơn hàng {orderId}
                    <div className="flex flex-wrap gap-3 mt-2">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded-sm mr-2"></div>
                            <span>Khung giờ đã chọn</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-red-500 rounded-sm mr-2"></div>
                            <span>Khung giờ đã đặt</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-gray-500 rounded-sm mr-2"></div>
                            <span>Khung giờ đã quá thời gian hoặc bảo trì</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-white border border-gray-300 rounded-sm mr-2"></div>
                            <span>Khung giờ có thể chọn</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date tabs */}
            <div className="mt-4 bg-white rounded-lg p-2 shadow-md">
                <Tabs
                    type="card"
                    activeKey={activeDate.format('YYYY-MM-DD')}
                    onChange={(key) => setActiveDate(dayjs(key))}
                    items={selectedDates.map(date => ({
                        label: (
                            <div className="flex items-center gap-2">
                                <span>{date.format('DD/MM/YYYY')}</span>
                                <Badge count={getSelectedSlotsCountByDate(date.format('YYYY-MM-DD'))} />
                                {selectedDates.length > 1 && (
                                    <Button 
                                        type="text" 
                                        size="small" 
                                        danger
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveDate(date);
                                        }}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        ),
                        key: date.format('YYYY-MM-DD'),
                        children: null
                    }))}
                />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {courtsData[activeDate.format('YYYY-MM-DD')]?.map((court) => (
                    <div
                        key={court.courtSlotId}
                        onClick={() => handleSelectCourt(court.courtSlotId)}
                        className={`p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 
                            ${selectedCourts[activeDate.format('YYYY-MM-DD')]?.some(c => c.courtSlotId === court.courtSlotId)
                                ? 'bg-yellow-200 border-2 border-yellow-500' 
                                : 'bg-white border border-gray-200'} 
                            hover:shadow-lg hover:bg-green-50`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">{court.courtSlotName}</h3>
                            <div className="text-sm text-gray-500">
                                {court.bookingSlots.filter(slot => slot.status === "AVAILABLE").length} khung giờ trống
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                            Giá từ: {Math.min(...court.bookingSlots.map(slot => 
                                userType === 'student' ? slot.studentPrice : slot.dailyPrice
                            )).toLocaleString()} VND
                        </div>
                    </div>
                ))}
            </div>

            {selectedCourts[activeDate.format('YYYY-MM-DD')]?.map(court => (
                <div key={court.courtSlotId} className="mt-6 bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">Chọn khung giờ - {court.courtSlotName} ({activeDate.format('DD/MM/YYYY')})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {court.bookingSlots.map((slot, index) => {
                            const activeDateStr = activeDate.format('YYYY-MM-DD');
                            const isLocked = lockedSlots[`${court.courtSlotId}-${slot.startTime}-${activeDateStr}`] || slot.status === "LOCKED";
                            const isSelected = selectedTimeSlots.some(s => 
                                s.startTime === slot.startTime && 
                                s.bookingDate === activeDate.format('YYYY-MM-DD') &&
                                s.courtSlotId === court.courtSlotId
                            );
                            
                            const isInExistingOrder = existingOrder && existingOrder.orderDetails && 
                                existingOrder.orderDetails.some((detail: any) => 
                                    detail.bookingDate === activeDate.format('YYYY-MM-DD') && 
                                    detail.bookingSlots.some((bookingSlot: any) => 
                                        bookingSlot.startTime === slot.startTime && 
                                        detail.courtId === court.courtSlotId
                                    )
                                );
                            
                            // Allow selecting slots that are in the existing order even if they appear locked
                            const isSelectable = !isLocked && slot.status !== "BOOKED" || isInExistingOrder;
                            
                            // Get price based on user type
                            const price = userType === 'student' ? slot.studentPrice : slot.dailyPrice;
                            
                            return (
                                <button
                                    key={index}
                                    onClick={() => isSelectable && handleSelectTimeSlot(slot, court.courtSlotId)}
                                    disabled={!isSelectable && !isSelected}
                                    className={`p-3 rounded-lg border transition-all duration-200 
                                    ${isSelected ? "bg-green-500 text-white" : 
                                      slot.status === "BOOKED" ? "bg-red-500 text-white" :
                                      !isSelectable ? "bg-gray-200 cursor-not-allowed text-gray-500" : 
                                      "bg-white hover:bg-green-50 border-green-200"}
                                    ${isInExistingOrder && !isSelected ? "border-orange-500 border-2" : ""}`}
                                >
                                    <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
                                    <div className="text-sm mt-1">
                                        {!isSelectable && !isInExistingOrder ? "Khóa sân" : 
                                         isInExistingOrder && !isSelected ? "Lịch hiện tại" : 
                                         `${price.toLocaleString()} VND`}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {selectedTimeSlots.length > 0 ? (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                    <h4 className="text-lg font-bold mb-4">Tổng giá cho {selectedTimeSlots.length} khung giờ:</h4>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                        <p className="text-xl text-green-600 font-bold">{priceInfo.totalPrice.toLocaleString()} VND</p>
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    <Empty 
                        description="Chưa có khung giờ nào được chọn" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        className="bg-white p-6 rounded-lg shadow-md"
                    />
                </div>
            )}

            <button
                onClick={() => setIsUserTypeModalVisible(true)}
                className="mt-6 w-full bg-yellow-500 text-white py-3 rounded-lg border-none font-bold text-lg shadow-md hover:bg-yellow-600 transition-all"
                disabled={selectedTimeSlots.length === 0}
            >
                TIẾP THEO
            </button>

            <Modal
                title="Xác nhận đặt sân"
                open={isUserTypeModalVisible}
                onOk={handleUserTypeConfirm}
                onCancel={() => setIsUserTypeModalVisible(false)}
                centered
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <div className="py-4">
                    <h3 className="font-bold text-lg mb-4">Thông tin đặt sân</h3>
                    
                    <div className="mb-4">
                        <h4 className="font-semibold">Sân đã chọn:</h4>
                        <ul className="list-disc pl-5 mt-2">
                            {selectedCourts[activeDate.format('YYYY-MM-DD')]?.map((court: Court) => (
                                <li key={court.courtSlotId}>{court.courtSlotName}</li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="mb-4">
                        <h4 className="font-semibold">Khung giờ đã chọn:</h4>
                        <ul className="list-disc pl-5 mt-2">
                            {selectedTimeSlots.map((slot, index) => (
                                <li key={index}>
                                    {slot.courtSlotName}: {slot.startTime} - {slot.endTime} ({dayjs(slot.bookingDate).format('DD/MM/YYYY')}) - 
                                    {user?.result.user.roles.some(role => role.name === "STUDENT") 
                                        ? ` ${slot.studentPrice.toLocaleString()} VND (Sinh viên)` 
                                        : ` ${slot.dailyPrice.toLocaleString()} VND`}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {selectedTimeSlots.length >= 2 && (
                        <div className="mt-4">
                            <h4 className="font-bold mb-2">Hình thức thanh toán</h4>
                            <Radio.Group
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                value={paymentMethod}
                                className="flex flex-col gap-4"
                            >
                                <Radio value="full" className="text-lg">
                                    <div className="p-4 border rounded-lg hover:bg-gray-50">
                                        <h3 className="font-bold">Thanh toán toàn bộ</h3>
                                        <p className="text-sm text-gray-500">Thanh toán đầy đủ {selectedTimeSlots.length} khung giờ</p>
                                    </div>
                                </Radio>
                                <Radio value="deposit" className="text-lg">
                                    <div className="p-4 border rounded-lg hover:bg-gray-50">
                                        <h3 className="font-bold">Đặt cọc</h3>
                                        <p className="text-sm text-gray-500">Cọc {(selectedTimeSlots.length - 2)} khung giờ ({(selectedTimeSlots.length - 2)*100/selectedTimeSlots.length}% tổng giá)</p>
                                    </div>
                                </Radio>
                            </Radio.Group>
                        </div>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-bold">Tổng thanh toán:</h4>
                        <p className="text-2xl text-green-600 font-bold">
                            {priceInfo.paymentAmount.toLocaleString()} VND
                        </p>
                        {selectedTimeSlots.length >= 3 && paymentMethod === 'deposit' && (
                            <p className="text-sm text-gray-500 mt-1">
                                (Đã bao gồm cọc {priceInfo.depositAmount.toLocaleString()} VND - 
                                Tổng giá: {priceInfo.totalPrice.toLocaleString()} VND)
                            </p>
                        )}
                    </div>

                    {!user && (
                        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                            Vui lòng đăng nhập để sử dụng ưu đãi
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ScheduleGrid;