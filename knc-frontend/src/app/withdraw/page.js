"use client";

import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Withdraw() {
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
    const router = useRouter();

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (!storedUsername) {
            router.push('/auth');
        } else {
            setUsername(storedUsername);
            fetchUserBalance(storedUsername);
        }
    }, [router]);

    const fetchUserBalance = async (username) => {
        try {
            const response = await fetch(`http://localhost:8000/auth/balance/${username}`);
            if (response.ok) {
                const data = await response.json();
                setBalance(data.balance);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const showToast = (message, type = 'info', duration = 4000) => {
        setToast({ message, type, isVisible: true, duration });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, isVisible: false }));
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setWithdrawAmount(value);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        
        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        
        if (amount > balance) {
            showToast('Insufficient funds', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/auth/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    amount: amount
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Successfully withdrew PHP ${amount.toFixed(2)}`, 'success', 5000);
                setBalance(data.new_balance);
                setWithdrawAmount('');
                
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                showToast(data.detail || 'Withdrawal failed', 'error');
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error');
            console.error('Withdrawal error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    if (!username) {
        return (
            <div className="flex bg-gray">
                <Sidebar />
                <div className="w-4/5 flex h-screen flex-col items-center">
                    {/* HEADER */}
                    <div className="flex items-center w-full h-24 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
                    <h1 className="text-primary text-4xl font-semibold mx-8">Dashboard</h1>
                    </div>

                    {/* LOADER */}
                    <div className="flex h-[calc(100%-24rem)] flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-gray">
            {/* Toast Notification */}
            <Toast 
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
                duration={toast.duration}
            />

            <Sidebar />
            <div className="w-4/5 flex h-screen flex-col items-center">
                {/* HEADER */}
                <div className="flex items-center w-full h-24 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
                    <h1 className='text-primary text-4xl font-semibold mx-8'>Withdraw</h1>
                </div>

                {/* Main Card Content */}
                <div className="flex w-full pt-16 px-40 items-center justify-center">
                    <div className='flex flex-col w-full bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] rounded-3xl p-12'>
                        <p className='text-gray-mid text-2xl font-medium tracking-wide'>ENTER AMOUNT</p>

                        <div className="flex flex-row items-center justify-center gap-6 text-8xl font-semibold tracking-wide py-24">
                            <h1 className="text-black">PHP</h1>
                            <input
                                type="text"
                                value={withdrawAmount}
                                onChange={handleAmountChange}
                                placeholder="0.00"
                                className="text-black border-b-4 border-primary mt-6 pb-4 bg-transparent text-center outline-none min-w-[300px]"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex flex-row items-center justify-center gap-6 text-2xl text-black font-medium tracking-wide">
                            <p>ACCOUNT BALANCE:</p>
                            <p className="text-primary-dark">PHP {formatCurrency(balance)}</p>
                        </div>

                        <div className="flex items-center justify-center mt-16">
                            <button 
                                onClick={handleWithdraw}
                                disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) > balance}
                                className={`px-12 py-3 rounded-xl text-xl font-semibold transition-all duration-200 ${
                                    isLoading || !withdrawAmount || parseFloat(withdrawAmount) > balance
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-primary text-orange-50 hover:bg-primary-light hover:scale-101 cursor-pointer'
                                }`}
                            >
                                {isLoading ? 'Processing...' : 'Withdraw'}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-lg text-black font-medium tracking-widest mt-8">Ensure you have sufficient balance to withdraw.</p>
            </div>
        </div>
    );
}
