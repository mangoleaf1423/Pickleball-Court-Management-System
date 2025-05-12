import React, { useState, useEffect, useCallback, useMemo } from "react";
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
    paymentStatus?: string;
}

interface DateCourtsData {
    [date: string]: Court[];
}

interface OrderDetail {
    courtSlotName: string;
    startTime: string;
    endTime: string;
    bookingDates: string[];
}

interface Order {
    id: string;
    courtId: string;
    courtName: string;
    address: string;
    userId: string;
    customerName: string;
    phoneNumber: string;
    note: string | null;
    orderType: string;
    orderStatus: string;
    paymentStatus: string;
    discountCode: string | null;
    totalAmount: number;
    discountAmount: number;
    paymentAmount: number;
    depositAmount: number;
    amountPaid: number;
    amountRefund: number | null;
    paymentTimeout: string;
    orderDetails: OrderDetail[];
    serviceDetails: any[];
    qrcode: string | null;
    createdAt: string;
}

const LOCAL_STORAGE_KEYS = {
    SELECTED_DATES: 'selectedDates',
    SELECTED_TIME_SLOTS: 'selectedTimeSlots',
    SELECTED_COURTS: 'selectedCourts',
    SELECTED_USER_TYPE: 'selectedUserType',
    PAYMENT_METHOD: 'paymentMethod',
    ACTIVE_DATE: 'activeDate'
};

const ChangeSchedule: React.FC = () => {
    const { id, orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useApp();
    
    // State management
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<Order | null>(null);
    const [selectedDates, setSelectedDates] = useState<Dayjs[]>([]);
    const [activeDate, setActiveDate] = useState<Dayjs>(dayjs());
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<SelectedTimeSlot[]>([]);
    const [selectedCourts, setSelectedCourts] = useState<{[date: string]: Court[]}>({});
    const [selectedUserType, setSelectedUserType] = useState<'student' | 'daily'>('daily');
    const [paymentMethod, setPaymentMethod] = useState<'full' | 'deposit'>('full');
    const [isUserTypeModalVisible, setIsUserTypeModalVisible] = useState(false);
    const [courtsData, setCourtsData] = useState<DateCourtsData>({});
    const [lockedSlots, setLockedSlots] = useState<{[key: string]: boolean}>({});
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isAddingDate, setIsAddingDate] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

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

    // Fetch order data
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            
            try {
                setLoading(true);
                const response = await axios.get(`${CURRENT_ENV.API_URL}/identity/public/getOrderById`, {
                    params: { orderId }
                });
                
                const orderData = response.data;
                setOrder(orderData);
                
                // Extract dates from order details
                if (orderData.orderDetails && orderData.orderDetails.length > 0) {
                    const orderDates = orderData.orderDetails.flatMap((detail: OrderDetail) => detail.bookingDates);
                    const uniqueDates = [...new Set(orderDates)] as string[];
                    const dayJsDates = uniqueDates.map((date: string) => dayjs(date));
                    
                    setSelectedDates(dayJsDates);
                    setActiveDate(dayJsDates[0]);
                }
                
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    // Fetch courts data for all selected dates
    useEffect(() => {
        const fetchCourtsForAllDates = async () => {
            if (!order || selectedDates.length === 0) return;
            
            setLoading(true);
            
            try {
                const newCourtsData: DateCourtsData = {};
                
                // Fetch data for each selected date
                for (const date of selectedDates) {
                    const dateStr = date.format('YYYY-MM-DD');
                    
                    // Skip if we already have data for this date
                    if (courtsData[dateStr] && courtsData[dateStr].length > 0) {
                        newCourtsData[dateStr] = courtsData[dateStr];
                        continue;
                    }
                    
                    const response = await axios.get(`${CURRENT_ENV.API_URL}/court/public/booking_slot`, {
                        params: {
                            courtId: order.courtId,
                            dateBooking: dateStr
                        }
                    });
                    
                    newCourtsData[dateStr] = response.data;
                    
                    // Initialize lockedSlots for this date
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
                
                // Set selected courts and time slots from the order
                if (order.orderDetails && order.orderDetails.length > 0) {
                    const newSelectedCourts: {[date: string]: Court[]} = {};
                    const newSelectedTimeSlots: SelectedTimeSlot[] = [];
                    
                    order.orderDetails.forEach((detail: OrderDetail) => {
                        detail.bookingDates.forEach(date => {
                            // Find the court in courtsData
                            const court = newCourtsData[date]?.find((c: Court) => 
                                c.courtSlotName === detail.courtSlotName
                            );
                            
                            if (court) {
                                if (!newSelectedCourts[date]) {
                                    newSelectedCourts[date] = [];
                                }
                                
                                if (!newSelectedCourts[date].some(c => c.courtSlotId === court.courtSlotId)) {
                                    newSelectedCourts[date].push(court);
                                }
                                
                                // Find the time slot
                                const timeSlot = court.bookingSlots.find(
                                    slot => slot.startTime === detail.startTime && slot.endTime === detail.endTime
                                );
                                
                                if (timeSlot) {
                                    newSelectedTimeSlots.push({
                                        ...timeSlot,
                                        courtSlotId: court.courtSlotId,
                                        courtSlotName: court.courtSlotName,
                                        bookingDate: date
                                    });
                                }
                            }
                        });
                    });
                    
                    setSelectedCourts(newSelectedCourts);
                    setSelectedTimeSlots(newSelectedTimeSlots);
                }
                
            } catch (error) {
                console.error("Error fetching courts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourtsForAllDates();
    }, [order, selectedDates]);

    // Handle adding a new date
    const handleAddDate = useCallback((date: Dayjs | null) => {
        if (!date) return;
        
        // Check if date already exists
        setSelectedDates(prev => {
            if (prev.some(d => d.format('YYYY-MM-DD') === date.format('YYYY-MM-DD'))) {
                setActiveDate(date);
                return prev;
            }
            return [...prev, date];
        });
        
        setActiveDate(date);
        setIsAddingDate(false);
    }, []);

    // Handle removing a date
    const handleRemoveDate = useCallback((dateToRemove: Dayjs) => {
        setSelectedDates(prev => {
            const updatedDates = prev.filter(
                date => date.format('YYYY-MM-DD') !== dateToRemove.format('YYYY-MM-DD')
            );
            
            if (updatedDates.length === 0) {
                // If removing the last date, add today's date
                return [dayjs()];
            }
            
            return updatedDates;
        });
        
        // If active date is being removed, set active date to the first date in the list
        setActiveDate(prev => {
            if (prev.format('YYYY-MM-DD') === dateToRemove.format('YYYY-MM-DD')) {
                return selectedDates.filter(
                    date => date.format('YYYY-MM-DD') !== dateToRemove.format('YYYY-MM-DD')
                )[0] || dayjs();
            }
            return prev;
        });
        
        // Remove all time slots for this date
        setSelectedTimeSlots(prev => 
            prev.filter(slot => slot.bookingDate !== dateToRemove.format('YYYY-MM-DD'))
        );
        
        // Remove selected courts for this date
        setSelectedCourts(prev => {
            const updatedCourts = { ...prev };
            delete updatedCourts[dateToRemove.format('YYYY-MM-DD')];
            return updatedCourts;
        });
    }, [selectedDates]);

    // Handle selecting a court
    const handleSelectCourt = useCallback((courtId: string) => {
        const activeDateStr = activeDate.format('YYYY-MM-DD');
        const court = courtsData[activeDateStr]?.find(c => c.courtSlotId === courtId);
        
        if (!court) return;
        
        setSelectedCourts(prev => {
            const updatedCourts = { ...prev };
            
            if (!updatedCourts[activeDateStr]) {
                updatedCourts[activeDateStr] = [];
            }
            
            const isCourtSelected = updatedCourts[activeDateStr].some(c => c.courtSlotId === courtId);
            
            if (isCourtSelected) {
                updatedCourts[activeDateStr] = updatedCourts[activeDateStr].filter(c => c.courtSlotId !== courtId);
                
                // Also remove any time slots for this court on this date
                setSelectedTimeSlots(prevSlots => 
                    prevSlots.filter(slot => !(
                        slot.courtSlotId === courtId && 
                        slot.bookingDate === activeDateStr
                    ))
                );
            } else {
                updatedCourts[activeDateStr] = [...updatedCourts[activeDateStr], court];
            }
            
            return updatedCourts;
        });
    }, [activeDate, courtsData]);

    // Handle selecting a time slot
    const handleSelectTimeSlot = useCallback((slot: TimeSlot, courtId: string) => {
        const activeDateStr = activeDate.format('YYYY-MM-DD');
        const isSlotLocked = lockedSlots[`${courtId}-${slot.startTime}-${activeDateStr}`];
        const court = courtsData[activeDateStr]?.find(c => c.courtSlotId === courtId);
        
        // Check if this slot is in the original order
        const isInOriginalOrder = order?.orderDetails.some(detail => 
            detail.startTime === slot.startTime && 
            detail.endTime === slot.endTime && 
            detail.courtSlotName === court?.courtSlotName &&
            detail.bookingDates.includes(activeDateStr)
        );
        
        // Allow selecting/deselecting slots that are in the original order even if they appear locked
        if ((isSlotLocked || slot.status === "LOCKED" || slot.status === "BOOKED") && !isInOriginalOrder) return;
        
        if (!court) return;
        
        setSelectedTimeSlots(prev => {
            const isAlreadySelected = prev.some(
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

            return isAlreadySelected 
                ? prev.filter(s => !(
                    s.startTime === slot.startTime && 
                    s.bookingDate === activeDateStr &&
                    s.courtSlotId === courtId
                ))
                : [...prev, newSlot];
        });
    }, [activeDate, courtsData, lockedSlots, order]);

    // Calculate total price based on selections
    const calculateTotalPrice = useCallback((): PriceCalculation => {
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
        let paymentStatus = "Chưa thanh toán";

        // Set payment method based on the number of selected time slots
        if (selectedTimeSlots.length === 1) {
            // Don't call setPaymentMethod here to avoid re-renders
            // We'll just use 'full' in our calculations
            const effectivePaymentMethod = 'full';
            paymentAmount = basePrice;
        } else if (paymentMethod === 'deposit') {
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
        }

        if (order) {
            const amountPaid = order.amountPaid || 0;
            const previousTotalAmount = order.totalAmount || 0;
            
            // Trường hợp 1: Tổng tiền mới > Tổng tiền cũ (khách book thêm slot)
            if (basePrice > previousTotalAmount) {
                if (paymentMethod === 'full') {
                    // Thanh toán thêm phần chênh lệch
                    paymentAmount = basePrice - amountPaid;
                    paymentStatus = "Chưa thanh toán";
                } else {
                    // Đặt cọc: Hoàn tiền lại cho khách
                    paymentAmount = depositAmount - amountPaid;
                    paymentStatus = "Đã đặt cọc";
                }
            }
            // Trường hợp 2: Tổng tiền mới = Tổng tiền cũ (khách đổi slot nhưng giữ nguyên số lượng)
            else if (basePrice === previousTotalAmount) {
                if (paymentMethod === 'full') {
                    paymentAmount = 0; // Không cần thanh toán thêm
                    paymentStatus = "Đã thanh toán";
                } else {
                    // Đặt cọc: Hoàn tiền lại cho khách
                    paymentAmount = depositAmount - amountPaid;
                    paymentStatus = "Đã đặt cọc";
                }
            }
            // Trường hợp 3: Tổng tiền mới < Tổng tiền cũ (khách bỏ bớt slot)
            else {
                // Hoàn tiền lại cho khách
                if (paymentMethod === 'full') {
                    paymentAmount = basePrice - amountPaid;
                    paymentStatus = "Đã thanh toán";
                } else {
                    paymentAmount = depositAmount - amountPaid;
                    // Nếu chỉ còn 1 slot, luôn là "Đã thanh toán" dù chọn Đặt cọc
                    paymentStatus = selectedTimeSlots.length === 1 ? "Đã thanh toán" : "Đã đặt cọc";
                }
            }
            
            // Đảm bảo depositAmount luôn có giá trị
            if (depositAmount === 0 && selectedTimeSlots.length > 0) {
                const slotsForDeposit = [...selectedTimeSlots]
                    .sort((a, b) => new Date(`${a.bookingDate} ${a.startTime}`).getTime() - new Date(`${b.bookingDate} ${b.startTime}`).getTime())
                    .slice(0, Math.ceil(selectedTimeSlots.length * 0.3));
                
                depositAmount = slotsForDeposit.reduce((total: number, slot: SelectedTimeSlot) => {
                    return total + (userType === 'student' ? slot.studentPrice : slot.dailyPrice);
                }, 0);
            }
        }

        return {
            totalPrice: basePrice,
            paymentAmount: paymentAmount,
            depositAmount: depositAmount,
            paymentStatus: paymentStatus
        };
    }, [selectedTimeSlots, user, paymentMethod, order]);

    // Memoized price calculation
    const priceInfo = useMemo(() => calculateTotalPrice(), [calculateTotalPrice]);

    // Handle confirm changes
    const handleConfirmChanges = useCallback(() => {
        // Here you would implement the API call to update the order
        console.log("Changes confirmed", {
            orderId,
            selectedTimeSlots,
            selectedCourts,
            totalPrice: priceInfo.totalPrice,
            paymentAmount: priceInfo.paymentAmount
        });
        
        // Close modal and navigate back
        setIsConfirmModalVisible(false);
        navigate(-1);
    }, [orderId, selectedTimeSlots, selectedCourts, priceInfo, navigate]);

    // Handle user type confirmation
    const handleUserTypeConfirm = useCallback(() => {
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
                existingOrder: order,
                courtName: order?.courtName,
                paymentStatus: priceInfo.paymentStatus
            } 
        });
    }, [selectedTimeSlots, user, priceInfo, order, orderId, selectedCourts, paymentMethod, navigate]);

    // Get count of selected slots for each date
    const getSelectedSlotsCountByDate = useCallback((date: string) => {
        return selectedTimeSlots.filter(slot => slot.bookingDate === date).length;
    }, [selectedTimeSlots]);

    // Determine user type based on roles for display purposes
    const getUserType = useCallback((): 'student' | 'daily' => {
        if (user?.result.user.roles.some(role => role.name === "STUDENT")) {
            return 'student';
        }
        return 'daily';
    }, [user]);

    const userType = useMemo(() => getUserType(), [getUserType]);

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
                        <h2 className="text-lg font-bold">Thay đổi lịch đặt</h2>
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
                            <span>Khung giờ đã quá thời gian</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-white border border-gray-300 rounded-sm mr-2"></div>
                            <span>Khung giờ có thể chọn</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order information */}
            {order && (
                <div className="mt-4 bg-white rounded-lg p-4 shadow-md">
                    <h3 className="text-lg font-bold mb-2">Thông tin đơn hàng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p><span className="font-semibold">Mã đơn:</span> {order.id}</p>
                            <p><span className="font-semibold">Sân:</span> {order.courtName}</p>
                            <p><span className="font-semibold">Địa chỉ:</span> {order.address}</p>
                        </div>
                        <div>
                            <p><span className="font-semibold">Khách hàng:</span> {order.customerName}</p>
                            <p><span className="font-semibold">Số điện thoại:</span> {order.phoneNumber}</p>
                            <p><span className="font-semibold">Trạng thái:</span> {order.orderStatus}</p>
                        </div>
                    </div>
                </div>
            )}

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
                            
                            // Check if this slot is in the original order
                            const isInOriginalOrder = order?.orderDetails.some(detail => 
                                detail.startTime === slot.startTime && 
                                detail.endTime === slot.endTime && 
                                detail.courtSlotName === court.courtSlotName &&
                                detail.bookingDates.includes(activeDateStr)
                            );
                            
                            // Get price based on user type
                            const price = userType === 'student' ? slot.studentPrice : slot.dailyPrice;
                            
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSelectTimeSlot(slot, court.courtSlotId)}
                                    className={`p-3 rounded-lg border transition-all duration-200 
                                    ${isSelected ? "bg-green-500 text-white" : 
                                      slot.status === "BOOKED" && !isInOriginalOrder ? "bg-red-500 text-white" :
                                      isLocked && !isInOriginalOrder ? "bg-gray-200 text-gray-500" : 
                                      "bg-white hover:bg-green-50 border-green-200"}
                                    ${isInOriginalOrder && !isSelected ? "border-orange-500 border-2" : ""}`}
                                >
                                    <div className="font-medium">{slot.startTime} - {slot.endTime}</div>
                                    <div className="text-sm mt-1">
                                        {isInOriginalOrder && !isSelected ? "Lịch hiện tại (Bỏ lịch)" : 
                                         isInOriginalOrder && isSelected ? `${price.toLocaleString()} VND (Đã chọn)` :
                                         slot.status === "BOOKED" && !isInOriginalOrder ? "Đã đặt" : 
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
                XÁC NHẬN THAY ĐỔI
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
                        <h4 className="font-bold">{priceInfo.paymentAmount < 0 ? 'Số tiền hoàn:' : 'Tổng thanh toán:'}</h4>
                        <p className="text-2xl text-green-600 font-bold">
                            {Math.abs(priceInfo.paymentAmount).toLocaleString()} VND
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

export default ChangeSchedule;