import { useApp } from '@/store';
import { Row, Col, Button, Modal, Select, message } from 'antd';
import { BoltIcon, CalendarDays } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import { t } from 'i18next';

interface Court {
  id: string;
  name: string;
  active: boolean;
}

const Booking = () => {
    const navigate = useNavigate();
    const { id, place } = useParams();
    const { user } = useApp();
    const [courts, setCourts] = useState<Court[]>([]);
    const [selectedCourtId, setSelectedCourtId] = useState<string>('');
    const [selectedCourtName, setSelectedCourtName] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'regular' | 'auto'>('regular');
    
    useEffect(() => {
        const fetchCourts = async () => {
            try {
                let url = `${CURRENT_ENV.API_URL}/court/public/getAll`;
                
                const response = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${user?.result.token}`
                    }
                });
                
                // Lọc sân theo courtNames của user nếu user có role STAFF
                let filteredCourts = response.data;
                if (user?.result.user.roles.some((role: any) => role.name === 'STAFF') && user?.result.user.courtNames) {
                    filteredCourts = response.data.filter((court: any) => 
                        user.result.user.courtNames?.includes(court.name)
                    );
                }
                
                setCourts(filteredCourts);
                if (filteredCourts.length > 0) {
                    setSelectedCourtId(filteredCourts[0].id);
                    setSelectedCourtName(filteredCourts[0].name);
                }
            } catch (error) {
                toast.error(t('common:message.error'));
            }
        };
        fetchCourts();
    }, [user]);
    
    const handleSchedule = () => {
        localStorage.removeItem('selectedDate');    
        localStorage.removeItem('selectedTimeSlots');
        localStorage.removeItem('selectedCourts');
        localStorage.removeItem('selectedUserType');
        setModalType('regular');
        setIsModalVisible(true);
    };
    
    const handleAutoSchedule = () => {
        localStorage.removeItem('scheduleAutoState');
        setModalType('auto');
        setIsModalVisible(true);
    };
    
    const handleCourtSelect = (value: string, option: any) => {
        setSelectedCourtId(value);
        setSelectedCourtName(option.label);
    };
    
    const handleModalOk = () => {
        if (!selectedCourtId) {
            message.error('Vui lòng chọn sân');
            return;
        }
        
        setIsModalVisible(false);
        
        if (modalType === 'regular') {
            navigate(`/schedule/${selectedCourtId}`, { state: { courtName: selectedCourtName } });
        } else {
            navigate(`/schedule-auto/${selectedCourtId}`, { state: { courtName: selectedCourtName } });
        }
    };

    return (
        <>
            <Row gutter={[24, 24]} style={{ marginTop: 16 }}> 
                <Col span={24}>
                    <Button 
                        type="primary"
                        icon={<CalendarDays />}
                        onClick={handleAutoSchedule}
                        size="large"
                        block
                        style={{ 
                            height: 64,
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        Đặt lịch cố định
                    </Button>
                </Col>
                
                <Col span={24}>
                    <Button 
                        type="default"
                        icon={<BoltIcon />}
                        onClick={handleSchedule}
                        size="large"
                        block
                        style={{ 
                            height: 64,
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        Đặt lịch hàng ngày
                    </Button>
                </Col>
            </Row>
            
            <Modal
                title={modalType === 'regular' ? "Chọn sân để đặt lịch" : "Chọn sân để đặt lịch cố định"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
            >
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn sân"
                    value={selectedCourtId}
                    onChange={handleCourtSelect}
                    options={courts.map(court => ({
                        label: court.name,
                        value: court.id
                    }))}
                />
            </Modal>
        </>
    );
};

export default Booking;
