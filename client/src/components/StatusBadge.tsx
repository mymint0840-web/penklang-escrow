interface StatusBadgeProps {
  status: string;
  type?: 'transaction' | 'kyc';
}

export default function StatusBadge({ status, type = 'transaction' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === 'kyc') {
      switch (status) {
        case 'none':
          return {
            text: 'ยังไม่ได้ยืนยัน',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-300',
          };
        case 'pending':
          return {
            text: 'รอการตรวจสอบ',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-300',
          };
        case 'approved':
          return {
            text: 'ยืนยันแล้ว',
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-300',
          };
        case 'rejected':
          return {
            text: 'ไม่ผ่าน',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-300',
          };
        default:
          return {
            text: status,
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-300',
          };
      }
    }

    // Transaction statuses
    switch (status) {
      case 'pending':
        return {
          text: 'รอดำเนินการ',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
        };
      case 'paid':
        return {
          text: 'ชำระเงินแล้ว',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
        };
      case 'confirmed':
        return {
          text: 'ยืนยันแล้ว',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-300',
        };
      case 'shipped':
        return {
          text: 'จัดส่งแล้ว',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-800',
          borderColor: 'border-indigo-300',
        };
      case 'delivered':
        return {
          text: 'ได้รับสินค้าแล้ว',
          bgColor: 'bg-teal-100',
          textColor: 'text-teal-800',
          borderColor: 'border-teal-300',
        };
      case 'completed':
        return {
          text: 'สำเร็จ',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
        };
      case 'disputed':
        return {
          text: 'มีข้อพิพาท',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300',
        };
      case 'cancelled':
        return {
          text: 'ยกเลิก',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
        };
      case 'refunded':
        return {
          text: 'คืนเงินแล้ว',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
        };
      default:
        return {
          text: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.text}
    </span>
  );
}
