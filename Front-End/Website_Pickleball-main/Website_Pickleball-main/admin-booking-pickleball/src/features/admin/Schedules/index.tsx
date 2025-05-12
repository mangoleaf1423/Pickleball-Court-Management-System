import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DatePicker, Modal, Radio } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";

type TimeSlotStatus = "available" | "booked" | "locked" | "selected";

interface TimeSlot {
    time: string;
    status: TimeSlotStatus;
}

interface Court {
    name: string;
    slots: TimeSlot[];
}

const generateTimeSlots = (): TimeSlot[] => {
    const times = [
        "5:00", "5:30", "6:00", "6:30", "7:00", "7:30", "8:00", "8:30",
        "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00",
        "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
        "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00",
        "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
    ];
    return times.map((time) => ({
        time,
        status: Math.random() > 0.7 ? "booked" : Math.random() > 0.9 ? "locked" : "available",
    }));
};

const courts: Court[] = [
    { name: "A", slots: generateTimeSlots() },
    { name: "B", slots: generateTimeSlots() },
    { name: "C", slots: generateTimeSlots() },
    { name: "D", slots: generateTimeSlots() },
    { name: "E", slots: generateTimeSlots() },
    { name: "F", slots: generateTimeSlots() },
];

const Schedule: React.FC = () => {
    const [schedule, setSchedule] = useState<Court[]>(courts);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const navigate = useNavigate();
    const [isUserTypeModalVisible, setIsUserTypeModalVisible] = useState(false);
    const [selectedUserType, setSelectedUserType] = useState<'student' | 'regular' | null>(null);


    const handleNextStep = () => {
        setIsUserTypeModalVisible(true);
    };


    const handleUserTypeConfirm = () => {
        if (selectedUserType) {
            setIsUserTypeModalVisible(false);
            console.log('Selected user type:', selectedUserType);
        }
    };

    const handleSelectDate = (date: Dayjs | null) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const toggleSelectSlot = (courtIndex: number, slotIndex: number) => {
        setSchedule((prevSchedule) =>
            prevSchedule.map((court, ci) =>
                ci === courtIndex
                    ? {
                        ...court,
                        slots: court.slots.map((slot, si) =>
                            si === slotIndex
                                ? {
                                    ...slot,
                                    status:
                                        slot.status === "available"
                                            ? "selected"
                                            : slot.status === "selected"
                                                ? "available"
                                                : slot.status,
                                }
                                : slot
                        ),
                    }
                    : court
            )
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-green-800 text-white p-4 rounded-md shadow-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                            aria-label="Quay lại trang trước"
                        >
                            <ArrowLeft className="w-5 h-5 cursor-pointer" />
                        </button>
                        <h2 className="text-lg font-bold">Đặt lịch hàng ngày</h2>
                    </div>

                    {/* Ô chọn ngày */}
                    <div className="relative">
                        <DatePicker
                            value={selectedDate}
                            onChange={handleSelectDate}
                            format="YYYY-MM-DD"
                        />
                    </div>
                </div>

                {/* Chú thích màu sắc */}
                <div className="flex gap-6 mt-4 text-sm">
                    <div className="flex items-center">
                        <span className="w-4 h-4 bg-white border border-gray-300 rounded inline-block mr-2"></span> Trống
                    </div>
                    <div className="flex items-center">
                        <span className="w-4 h-4 bg-red-500 rounded inline-block mr-2"></span> Đã đặt
                    </div>
                    <div className="flex items-center">
                        <span className="w-4 h-4 bg-gray-500 rounded inline-block mr-2"></span> Khóa
                    </div>
                </div>

                {/* Nút xem sân & bảng giá */}
                <div className="mt-3 text-right">
                    <a href="#" className="text-yellow-300 font-semibold">Xem sân & bảng giá</a>
                </div>
            </div>

            {/* Schedule Table */}
            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-3 rounded-tl-lg">Sân</th>
                            {schedule[0].slots.map((slot, index) => (
                                <th key={index} className="border p-2 text-xs">{slot.time}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((court, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className="border p-3 bg-green-100 font-bold text-center rounded-bl-lg">{court.name}</td>
                                {court.slots.map((slot, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`border p-3 text-center rounded cursor-pointer transition-all duration-200
                      ${slot.status === "available"
                                                ? "bg-white hover:bg-green-100 shadow-sm"
                                                : slot.status === "selected"
                                                    ? "bg-green-400 shadow-md transform scale-105"
                                                    : slot.status === "booked"
                                                        ? "bg-red-500 text-white cursor-not-allowed"
                                                        : "bg-gray-500 text-white cursor-not-allowed"
                                            }`}
                                        onClick={() =>
                                            slot.status === "available" || slot.status === "selected"
                                                ? toggleSelectSlot(rowIndex, colIndex)
                                                : null
                                        }
                                    ></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={handleNextStep}
                className="mt-auto w-full bg-yellow-500 text-white py-3 rounded-lg border-none font-bold text-lg shadow-md hover:bg-yellow-600 transition-all">
                TIẾP THEO
            </button>

            <Modal
                title="Chọn đối tượng"
                open={isUserTypeModalVisible}
                onOk={handleUserTypeConfirm}
                onCancel={() => setIsUserTypeModalVisible(false)}
                centered
                okText="Xác nhận"
                cancelText="Hủy"
                okButtonProps={{ disabled: !selectedUserType }}
            >
                <div className="py-4">
                    <Radio.Group
                        onChange={(e) => setSelectedUserType(e.target.value)}
                        value={selectedUserType}
                        className="flex flex-col gap-4"
                    >
                        <Radio value="student" className="text-lg">
                            <div className="p-4 border rounded-lg hover:bg-gray-50">
                                <h3 className="font-bold">Học sinh/Sinh viên</h3>
                                <p className="text-sm text-gray-500">Ưu đãi giảm 20% cho thẻ học sinh/sinh viên</p>
                            </div>
                        </Radio>

                        <Radio value="regular" className="text-lg">
                            <div className="p-4 border rounded-lg hover:bg-gray-50">
                                <h3 className="font-bold">Khách hàng thông thường</h3>
                                <p className="text-sm text-gray-500">Đặt lịch với giá tiêu chuẩn</p>
                            </div>
                        </Radio>
                    </Radio.Group>
                </div>
            </Modal>
        </div>
    );
};

export default Schedule;