"use client";

import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// bring in the same icons we used in Sidebar
import { FaMoneyBillWave, FaRegMoneyBillAlt } from "react-icons/fa";
import { RiBankCardFill, RiBankCardLine } from "react-icons/ri";
import { MdSend, MdOutlineSend } from "react-icons/md";

export default function Dashboard() {
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (!storedUsername) {
            router.push('/auth/login');
        } else {
            setUsername(storedUsername);
            fetchDashboardData(storedUsername);
        }
    }, [router]);

    const fetchDashboardData = async (username) => {
        try {
            setIsLoading(true);
            const [balanceResponse, transactionsResponse] = await Promise.all([
                fetch(`http://localhost:8000/auth/balance/${username}`),
                fetch(`http://localhost:8000/auth/transactions/${username}?limit=5`)
            ]);

            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                setBalance(balanceData.balance);
            }

            if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                setTransactions(transactionsData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
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

    const getTransactionDisplayName = (transaction) => {
        const type = transaction.type.toLowerCase();
        switch (type) {
            case 'deposit': return 'Deposit';
            case 'withdraw': return 'Withdraw';
            case 'pay_bills': return `Pay Bills - ${transaction.company || 'Unknown'}`;
            case 'send_money': return `To ${transaction.recipient || 'Unknown'}`;
            case 'receive_money': return `From ${transaction.sender || 'Unknown'}`;
            default: return transaction.type;
        }
    };

    const getTransactionColor = (type) => {
        const transactionType = type.toLowerCase();
        switch (transactionType) {
            case 'deposit':
            case 'receive_money': return 'text-green-600';
            case 'withdraw':
            case 'send_money':
            case 'pay_bills': return 'text-red-600';
            default: return 'text-primary-dark';
        }
    };

    if (isLoading) {
        return (
            <div className="flex w-screen h-screen flex-col items-center justify-center">
                <p className="text-lg text-primary">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex bg-gray">
            <Sidebar />
            <div className="w-4/5 flex h-screen flex-col items-center">
                {/* HEADER */}
                <div className="flex items-center w-full h-24 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
                    <h1 className='text-primary text-4xl font-semibold mx-8'>Dashboard</h1>
                </div>
                
                <div className='flex flex-col w-full py-12 gap-12'>
                    {/* TOP BENTO BOX - ACCOUNT BALANCE */}
                    <div className='flex flex-col h-auto bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] rounded-3xl mx-40 p-8'>
                        <p className='text-gray-mid text-2xl font-medium tracking-wide'>ACCOUNT BALANCE</p>
                        <div className="flex flex-row items-center justify-center gap-6 text-8xl font-semibold tracking-wide py-10">
                            <h1 className="text-black">PHP</h1>
                            <h1 className="text-primary">{formatCurrency(balance)}</h1>
                        </div>
                    </div>
                    
                    {/* BOTTOM BENTO */}
                    <div className="flex flex-row gap-12 mx-40">
                        {/* LEFT BENTO - SERVICES */}
                        <div className='flex flex-col w-3/7 h-auto bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] rounded-2xl p-8'>
                            <p className='text-gray-mid text-2xl font-medium tracking-wide'>SERVICES</p>
                            <div className="flex flex-col py-8 items-center gap-8">
                                <div className="flex flex-row gap-24">
                                    <Link href="/deposit" className="flex flex-col items-center justify-center">
                                        <div className="bg-gray-light p-10 rounded-2xl hover:bg-gray-sub transition-all duration-200 ease-in-out cursor-pointer">
                                            <FaMoneyBillWave className="text-6xl text-black" />
                                        </div>
                                        <p className="text-primary text-lg font-semibold tracking-wide mt-2">DEPOSIT</p>
                                    </Link>
                                    <Link href="/withdraw" className="flex flex-col items-center justify-center">
                                        <div className="bg-gray-light p-10 rounded-2xl hover:bg-gray-sub transition-all duration-200 ease-in-out cursor-pointer">
                                            <RiBankCardFill className="text-6xl text-black" />
                                        </div>
                                        <p className="text-primary text-lg font-semibold tracking-wide mt-2">WITHDRAW</p>
                                    </Link>
                                </div>
                                <div className="flex flex-row gap-24">
                                    <Link href="/send-money" className="flex flex-col items-center justify-center">
                                        <div className="bg-gray-light p-10 rounded-2xl hover:bg-gray-sub transition-all duration-200 ease-in-out cursor-pointer">
                                            <MdSend className="text-6xl text-black" />
                                        </div>
                                        <p className="text-primary text-lg font-semibold tracking-wide mt-2">SEND MONEY</p>
                                    </Link>
                                    <Link href="/pay-bills" className="flex flex-col items-center justify-center">
                                        <div className="bg-gray-light p-10 rounded-2xl hover:bg-gray-sub transition-all duration-200 ease-in-out cursor-pointer">
                                            <FaRegMoneyBillAlt className="text-6xl text-black" />
                                        </div>
                                        <p className="text-primary text-lg font-semibold tracking-wide mt-2">PAY BILLS</p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        
                        {/* RIGHT BENTO - TRANSACTION HISTORY */}
                        <div className='flex flex-col w-4/7 h-auto bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] rounded-2xl p-8'>
                            <p className='text-gray-mid text-2xl font-medium tracking-wide'>HISTORY</p>
                            <div className="flex flex-col items-center justify-center py-4 gap-6">
                                {transactions.length > 0 ? (
                                    transactions.map((transaction, index) => (
                                        <div 
                                            key={index} 
                                            className="flex flex-row items-center justify-between w-full px-4 py-3 rounded-xl shadow-sm bg-gray-light/30 hover:bg-gray-sub transition-all duration-200"
                                        >
                                            <p className="text-primary text-sm font-semibold">{transaction.reference_number}</p>
                                            <div className="flex flex-col text-center font-medium">
                                                <p className="text-black text-base">PHP {formatCurrency(transaction.amount)}</p>
                                                <p className={`text-sm ${getTransactionColor(transaction.type)}`}>
                                                    {getTransactionDisplayName(transaction)}
                                                </p>
                                            </div>
                                            <div className="flex flex-col text-right text-sm text-black">
                                                <p>{transaction.date}</p>
                                                <p>{transaction.time}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center py-8">
                                        <p className="text-black text-lg">No transactions yet</p>
                                    </div>
                                )}
                            </div>
                            <div className='flex items-center justify-center mt-6'>
                                <Link href="/history" className='underline text-lg text-primary font-semibold tracking-wide hover:text-primary-light transition-colors'>
                                    See more
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
