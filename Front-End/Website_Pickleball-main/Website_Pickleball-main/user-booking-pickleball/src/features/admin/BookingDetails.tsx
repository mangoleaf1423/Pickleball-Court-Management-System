import React, { useState } from "react";

interface BookingDetails {
  fieldName: string;
  address: string;
  date: string;
  time: string;
  price: string;
  targetAudience: string;
  duration: string;
  totalAmount: string;
}

const BookingForm: React.FC = () => {
  const bookingDetails: BookingDetails = {
    fieldName: "CLB Cầu Lông TPT Sport - Làng đại học",
    address: "Đ. Tôn Thất Tùng, Đông Hòa, Dĩ An, Bình Dương",
    date: "22/02/2025",
    time: "21h30 - 22h00",
    price: "30.000 đ",
    targetAudience: "Học sinh - sinh viên",
    duration: "0h30",
    totalAmount: "30.000 đ",
  };

  const [name, setName] = useState("Lê Bá Hà");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="w-screen min-h-screen bg-green-800 flex justify-center items-center p-4">
      <div className="w-full max-w-3xl bg-green-700 p-6 rounded-lg text-white shadow-lg">
        <h2 className="text-center font-bold text-lg mb-4">Đặt lịch hàng ngày trực quan</h2>

        {/* Booking Details */}
        <div className="bg-green-600 p-4 rounded-lg">
          <h3 className="font-bold flex items-center">📌 Thông tin đặt lịch</h3>
          <p><strong>Tên sân:</strong> {bookingDetails.fieldName}</p>
          <p><strong>Địa chỉ:</strong> {bookingDetails.address}</p>
          <p><strong>Ngày:</strong> {bookingDetails.date}</p>
          <p><strong>⏰ Thời gian:</strong> {bookingDetails.time} | {bookingDetails.price}</p>
          <p><strong>Đối tượng:</strong> {bookingDetails.targetAudience}</p>
          <p><strong>⏳ Tổng giờ:</strong> {bookingDetails.duration}</p>
          <p><strong>💰 Tổng tiền:</strong> {bookingDetails.totalAmount}</p>
        </div>

        {/* Form Fields */}
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-yellow-300">Tên của bạn</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 mt-1 rounded bg-white text-black"
            />
          </label>

          <label className="block">
            <span className="text-yellow-300">Số điện thoại</span>
            <div className="flex items-center bg-white rounded p-2">
              <span className="mr-2 text-black">+84</span>
              <input
                type="tel"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-black focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-yellow-300">Ghi chú cho chủ sân</span>
            <textarea
              placeholder="Nhập ghi chú"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 rounded bg-white text-black"
            ></textarea>
          </label>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={() => setTermsAccepted(!termsAccepted)}
            className="w-5 h-5 text-yellow-500 bg-white border-gray-300 rounded focus:ring-0"
          />
          <label htmlFor="terms" className="ml-2 text-white cursor-pointer">
            Tôi đồng ý với các điều khoản
          </label>
        </div>

        {/* Confirm Button */}
        <button
          className={`w-full mt-4 py-2 rounded font-bold ${
            termsAccepted ? "bg-yellow-500 text-black" : "bg-gray-500 text-gray-300 cursor-not-allowed"
          }`}
          disabled={!termsAccepted}
        >
          ✅ XÁC NHẬN & THANH TOÁN
        </button>
      </div>
    </div>
  );
};

export default BookingForm;