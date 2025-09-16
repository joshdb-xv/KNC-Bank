"use client";

import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { IoPersonAdd } from "react-icons/io5";

export default function SendMoney() {
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState(0);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [recipientValidation, setRecipientValidation] = useState({ isValid: null, message: "" });
  const [toast, setToast] = useState({ message: "", type: "", isVisible: false });
  const router = useRouter();
  const validationTimeoutRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      router.push("/auth/login");
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
      console.error("Error fetching balance:", error);
    }
  };

  // Validate recipient username with debouncing
  const validateRecipient = async (recipientName) => {
    if (!recipientName.trim()) {
      setRecipientValidation({ isValid: null, message: "" });
      return;
    }

    if (recipientName === username) {
      setRecipientValidation({ isValid: false, message: "Cannot send money to yourself" });
      return;
    }

    setIsValidatingRecipient(true);

    try {
      const response = await fetch(`http://localhost:8000/auth/balance/${recipientName}`);
      if (response.ok) {
        setRecipientValidation({ isValid: true, message: "Recipient found" });
      } else {
        setRecipientValidation({ isValid: false, message: "User not found" });
      }
    } catch (error) {
      setRecipientValidation({ isValid: false, message: "Error validating recipient" });
    } finally {
      setIsValidatingRecipient(false);
    }
  };

  const handleRecipientChange = (e) => {
    const value = e.target.value;
    setRecipientUsername(value);

    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Set new timeout for validation (debounce)
    validationTimeoutRef.current = setTimeout(() => {
      validateRecipient(value);
    }, 500);
  };

  const showToast = (message, type = "info", duration = 4000) => {
    setToast({ message, type, isVisible: true, duration });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSendAmount(value);
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleSendMoney = async () => {
    const amount = parseFloat(sendAmount);

    if (!recipientUsername.trim()) {
      showToast("Please enter a recipient username", "error");
      return;
    }

    if (!recipientValidation.isValid) {
      showToast("Please enter a valid recipient username", "error");
      return;
    }

    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    if (amount > balance) {
      showToast("Insufficient funds", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/auth/send-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_username: username,
          recipient_username: recipientUsername,
          amount: amount,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Successfully sent PHP ${amount.toFixed(2)} to ${recipientUsername}`, "success", 5000);
        setBalance(data.new_balance);
        setSendAmount("");
        setRecipientUsername("");
        setNotes("");
        setRecipientValidation({ isValid: null, message: "" });

        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        showToast(data.detail || "Transfer failed", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      console.error("Send money error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isTransferValid =
    recipientUsername.trim() &&
    recipientValidation.isValid &&
    sendAmount &&
    parseFloat(sendAmount) > 0 &&
    parseFloat(sendAmount) <= balance;

  if (!username) {
    return (
      <div className="flex w-screen h-screen flex-col items-center justify-center">
        <p className="text-lg text-primary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-gray">
      {/* Toast Notification */}
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} duration={toast.duration} />

      <Sidebar />
      <div className="w-4/5 flex h-screen flex-col items-center">
        {/* HEADER */}
        <div className="flex items-center w-full h-24 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
          <h1 className="text-primary text-4xl font-semibold mx-8">Send Money</h1>
        </div>

        {/* Main Card Content */}
        <div className="flex w-full pt-16 px-40 items-center justify-center">
          <div className="flex flex-col w-full bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] rounded-3xl p-12">
            {/* Recipient Selection */}
            <div className="mb-8">
              <p className="text-gray-mid text-2xl font-medium tracking-wide mb-4">SEND TO</p>
              <div className="relative">
                <IoPersonAdd size={22} color="#16A34A" className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10" />
                <input
                  type="text"
                  value={recipientUsername}
                  onChange={handleRecipientChange}
                  placeholder="Enter recipient username..."
                  disabled={isLoading}
                  className={`w-full py-4 pl-12 pr-4 text-lg font-medium rounded-xl border-2 
                    focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-opacity-50 
                    transition-colors duration-200 ${
                      recipientValidation.isValid === null
                        ? "bg-gray border-gray-300 focus:border-primary"
                        : recipientValidation.isValid
                        ? "bg-green-50 border-green-300 focus:border-green-500"
                        : "bg-red-50 border-red-300 focus:border-red-500"
                    }`}
                />
                {/* Validation Indicator */}
                {isValidatingRecipient && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              {/* Validation Message */}
              {recipientValidation.message && (
                <p className={`mt-2 text-sm ${recipientValidation.isValid ? "text-green-600" : "text-red-600"}`}>
                  {recipientValidation.message}
                </p>
              )}
            </div>

            {/* Amount Input */}
            <p className="text-gray-mid text-2xl font-medium tracking-wide">ENTER AMOUNT</p>
            <div className="flex flex-row items-center justify-center gap-6 text-8xl font-semibold tracking-wide py-12">
              <h1 className="text-black">PHP</h1>
              <input
                type="text"
                value={sendAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="text-black border-b-4 border-primary mt-6 pb-4 bg-transparent text-center outline-none min-w-[300px]"
                disabled={isLoading}
              />
            </div>

            {/* Notes Input */}
            <div className="mb-6">
              <p className="text-gray-mid text-xl font-medium tracking-wide mb-2">NOTES (Optional)</p>
              <input
                type="text"
                value={notes}
                onChange={handleNotesChange}
                placeholder="Enter transfer notes..."
                disabled={isLoading}
                className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Balance Display */}
            <div className="flex flex-row items-center justify-center gap-6 text-2xl text-black font-medium tracking-wide mb-6">
              <p>ACCOUNT BALANCE:</p>
              <p className="text-primary-dark">PHP {formatCurrency(balance)}</p>
            </div>

            {/* Send Money Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleSendMoney}
                disabled={isLoading || !isTransferValid}
                className={`px-12 py-3 rounded-xl text-xl font-semibold transition-all duration-200 ${
                  isLoading || !isTransferValid
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-primary text-orange-50 hover:bg-primary-light hover:scale-101 cursor-pointer"
                }`}
              >
                {isLoading ? "Processing..." : "Send Money"}
              </button>
            </div>
          </div>
        </div>

        <p className="text-lg text-black font-medium tracking-widest mt-8">Double check recipient and amount before proceeding.</p>
      </div>
    </div>
  );
}