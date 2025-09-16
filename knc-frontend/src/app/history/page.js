"use client";

import Sidebar from "@/components/Sidebar";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function History() {
    const [username, setUsername] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, deposit, withdraw, send_money, receive_money, pay_bills
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const storedUsername = localStorage.getItem('username');
        if (!storedUsername) {
            router.push('/auth/login');
        } else {
            setUsername(storedUsername);
            fetchTransactionHistory(storedUsername);
        }
    }, [router]);

    const fetchTransactionHistory = async (username) => {
        try {
            setIsLoading(true);
            setError('');
            
            // Fetch all transactions (no limit for history page)
            const response = await fetch(`http://localhost:8000/auth/transactions/${username}`);
            
            if (response.ok) {
                const transactionData = await response.json();
                setTransactions(transactionData);
            } else {
                setError('Failed to fetch transaction history');
            }
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            setError('Error fetching transaction history. Please try again.');
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
            case 'deposit':
                return 'Deposit';
            case 'withdraw':
                return 'Withdraw';
            case 'pay_bills':
                return `Pay Bills - ${transaction.company || 'Unknown'}`;
            case 'send_money':
                return `To ${transaction.recipient || 'Unknown'}`;
            case 'receive_money':
                return `From ${transaction.sender || 'Unknown'}`;
            default:
                return transaction.type;
        }
    };

    const getTransactionColor = (type) => {
        const transactionType = type.toLowerCase();
        switch (transactionType) {
            case 'deposit':
            case 'receive_money':
                return 'text-success';
            case 'withdraw':
            case 'send_money':
            case 'pay_bills':
                return 'text-error';
            default:
                return 'text-primary-dark';
        }
    };

    const getTransactionIcon = (type) => {
        const transactionType = type.toLowerCase();
        switch (transactionType) {
            case 'deposit':
                return '↗️';
            case 'withdraw':
                return '↙️';
            case 'send_money':
                return '📤';
            case 'receive_money':
                return '📥';
            case 'pay_bills':
                return '💳';
            default:
                return '💰';
        }
    };

    // Filter transactions based on selected filter and search term
    const filteredTransactions = transactions.filter(transaction => {
        const matchesFilter = filter === 'all' || transaction.type.toLowerCase() === filter;
        const matchesSearch = searchTerm === '' || 
            transaction.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (transaction.recipient && transaction.recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (transaction.sender && transaction.sender.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (transaction.company && transaction.company.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesFilter && matchesSearch;
    });

    if (!username) {
        return (
            <div className="flex w-screen h-screen flex-col items-center justify-center">
                <p className="text-lg text-primary">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex bg-gray">
            <Sidebar />
            <div className="w-4/5 flex h-screen flex-col">
                {/* HEADER */}
                <div className="flex items-center w-full h-24 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
                    <h1 className='text-primary text-4xl font-semibold mx-8'>Transaction History</h1>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* FILTERS AND SEARCH */}
                    <div className="bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] mx-40 mt-12 rounded-2xl p-6">
                        <div className="flex flex-row gap-6 items-center justify-between">
                            {/* Filter Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === 'all' 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-light text-primary hover:bg-gray-sub'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('deposit')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === 'deposit' 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-light text-primary hover:bg-gray-sub'
                                    }`}
                                >
                                    Deposits
                                </button>
                                <button
                                    onClick={() => setFilter('withdraw')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === 'withdraw' 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-light text-primary hover:bg-gray-sub'
                                    }`}
                                >
                                    Withdrawals
                                </button>
                                <button
                                    onClick={() => setFilter('send_money')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === 'send_money' 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-light text-primary hover:bg-gray-sub'
                                    }`}
                                >
                                    Sent
                                </button>
                                <button
                                    onClick={() => setFilter('receive_money')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === 'receive_money' 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-light text-primary hover:bg-gray-sub'
                                    }`}
                                >
                                    Received
                                </button>
                                <button
                                    onClick={() => setFilter('pay_bills')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        filter === 'pay_bills' 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-light text-primary hover:bg-gray-sub'
                                    }`}
                                >
                                    Bills
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="flex-1 max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* TRANSACTION LIST */}
                    <div className="flex-1 mx-40 my-12 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-lg text-primary">Loading transactions...</p>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-lg text-error mb-4">{error}</p>
                                    <button
                                        onClick={() => fetchTransactionHistory(username)}
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-lg text-gray-mid">
                                    {transactions.length === 0 ? 'No transactions found' : 'No transactions match your filter'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-y-auto h-full">
                                <div className="p-6">
                                    <h2 className="text-gray-mid text-2xl font-medium tracking-wide mb-6">
                                        {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''} Found
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        {filteredTransactions.map((transaction, index) => (
                                            <div 
                                                key={index} 
                                                className="bg-gray rounded-lg p-6 border border-gray-light hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-2xl">
                                                            {getTransactionIcon(transaction.type)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-primary">
                                                                {transaction.reference_number}
                                                            </h3>
                                                            <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                                                                {getTransactionDisplayName(transaction)}
                                                            </p>
                                                            {transaction.notes && (
                                                                <p className="text-sm text-gray-mid mt-1">
                                                                    Note: {transaction.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-black">
                                                            PHP {formatCurrency(transaction.amount)}
                                                        </p>
                                                        <div className="text-sm text-gray-mid">
                                                            <p>{transaction.date}</p>
                                                            <p>{transaction.time}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Transaction Description */}
                                                <div className="mt-4 pt-4 border-t border-gray-light">
                                                    <p className="text-gray-mid text-sm">
                                                        {transaction.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}