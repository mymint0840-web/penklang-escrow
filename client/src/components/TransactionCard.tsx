import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  status: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  description?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  userRole: 'buyer' | 'seller';
}

export default function TransactionCard({ transaction, userRole }: TransactionCardProps) {
  const router = useRouter();

  const otherParty = userRole === 'buyer' ? transaction.seller : transaction.buyer;

  const handleClick = () => {
    router.push(`/transactions/${transaction.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      {/* หัวข้อและสถานะ */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition">
            {transaction.title}
          </h3>
          {transaction.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{transaction.description}</p>
          )}
        </div>
        <StatusBadge status={transaction.status} type="transaction" />
      </div>

      {/* จำนวนเงิน */}
      <div className="mb-4">
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-blue-600">
            {transaction.amount.toLocaleString('th-TH')}
          </span>
          <span className="text-sm text-gray-600 ml-2">บาท</span>
        </div>
      </div>

      {/* ข้อมูลคู่ค้า */}
      <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-4">
        <div>
          <p className="text-gray-500 mb-1">
            {userRole === 'buyer' ? 'ผู้ขาย' : 'ผู้ซื้อ'}
          </p>
          <p className="text-gray-900 font-medium">
            {otherParty.firstName} {otherParty.lastName}
          </p>
        </div>

        <div className="text-right">
          <p className="text-gray-500 mb-1">สร้างเมื่อ</p>
          <p className="text-gray-900">
            {new Date(transaction.createdAt).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* แสดงไอคอนแสดงว่าเป็นบทบาทอะไร */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          {userRole === 'buyer' ? (
            <>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span>คุณเป็นผู้ซื้อ</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>คุณเป็นผู้ขาย</span>
            </>
          )}
          <span className="mx-2">•</span>
          <span>รหัส: {transaction.id.slice(-8).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
