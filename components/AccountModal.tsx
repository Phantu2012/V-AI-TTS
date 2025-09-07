
import React from 'react';
import { User, Plan } from '../types';

interface AccountModalProps {
  user: User;
  onClose: () => void;
}

const ProgressBar: React.FC<{ value: number; max: number; }> = ({ value, max }) => {
  const percentage = Math.round((value / max) * 100);
  return (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-gray-300">{value.toLocaleString('vi-VN')} / {max.toLocaleString('vi-VN')} ký tự</span>
            <span className="text-sm font-medium text-gray-300">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-brand-secondary to-brand-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    </div>
  );
};

export const AccountModal: React.FC<AccountModalProps> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Tài Khoản Của Tôi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-lg text-white">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Gói Hiện Tại</p>
            <p className="text-lg text-white font-semibold">{user.plan} Plan</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Số ký tự đã sử dụng trong tháng</p>
            <ProgressBar value={user.charactersUsed} max={user.characterLimit} />
          </div>
        </div>
        <div className="p-6 bg-gray-800/50 rounded-b-xl border-t border-gray-700">
            {user.plan === Plan.Free ? (
                <button className="w-full text-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Nâng cấp lên gói Creator
                </button>
            ) : (
                <button className="w-full text-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Quản lý Gói Đăng Ký
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
