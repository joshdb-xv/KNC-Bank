// components/Toast.js
import { useEffect } from 'react';

const Toast = ({ message, type, isVisible, onClose, duration = 4000 }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose, duration]);

    if (!isVisible) return null;

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bgColor: 'bg-green-500',
                    icon: '✓'
                };
            case 'error':
                return {
                    bgColor: 'bg-red-500',
                    icon: '✕'
                };
            case 'warning':
                return {
                    bgColor: 'bg-yellow-500',
                    icon: '⚠'
                };
            case 'info':
                return {
                    bgColor: 'bg-blue-500',
                    icon: 'ℹ'
                };
            default:
                return {
                    bgColor: 'bg-gray-500',
                    icon: '•'
                };
        }
    };

    const { bgColor, icon } = getToastStyles();

    return (
        <>
            <div className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-in`}>
                <span className="text-xl font-bold flex-shrink-0">{icon}</span>
                <span className="flex-1 font-medium break-words">{message}</span>
                <button 
                    onClick={onClose}
                    className="text-white hover:text-gray-200 text-xl font-bold ml-2 flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    aria-label="Close notification"
                >
                    ×
                </button>
            </div>

            {/* Toast Styles */}
            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default Toast;