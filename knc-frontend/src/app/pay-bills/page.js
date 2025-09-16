"use client";

import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { IoBusiness } from "react-icons/io5";

// ================= Custom Dropdown =================
const CustomDropdown = ({ value, onChange, options, placeholder, icon: Icon, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`relative flex items-center py-4 pl-12 pr-12 w-full 
        bg-gray border-2 border-gray-300 text-black text-lg font-medium rounded-xl 
        focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-opacity-50 focus:border-primary
        transition-colors duration-200 ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-light hover:border-gray-300"
        }`}
      >
        {Icon && <Icon size={22} color="#16A34A" className="absolute left-4" />}
        <span className={value ? "text-black" : "text-gray-sub"}>
          {value || placeholder}
        </span>
        {isOpen ? (
          <IoChevronUp className="absolute right-4 text-gray-mid" size={18} />
        ) : (
          <IoChevronDown className="absolute right-4 text-gray-mid" size={18} />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full 
        bg-white border border-gray-light rounded-xl shadow-lg z-50 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-3 text-base transition-colors duration-150 
                hover:bg-primary-subtle hover:text-primary-dark 
                ${value === option.value 
                  ? "bg-primary-subtle text-primary-dark font-semibold" 
                  : "text-gray-mid"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


// ================= PayBills Page =================
export default function PayBills() {
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState(0);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", isVisible: false });
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      router.push("/auth/login");
    } else {
      setUsername(storedUsername);
      fetchUserBalance(storedUsername);
      fetchCompanies();
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

  const fetchCompanies = async () => {
    try {
      const response = await fetch("http://localhost:8000/auth/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
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
      setPaymentAmount(value);
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handlePayBills = async () => {
    const amount = parseFloat(paymentAmount);

    if (!selectedCompany) {
      showToast("Please select a company to pay", "error");
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
      const response = await fetch("http://localhost:8000/auth/pay-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          company_name: selectedCompany,
          amount: amount,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Successfully paid PHP ${amount.toFixed(2)} to ${selectedCompany}`, "success", 5000);
        setBalance(data.new_balance);
        setPaymentAmount("");
        setSelectedCompany("");
        setNotes("");

        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        showToast(data.detail || "Payment failed", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      console.error("Payment error:", error);
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

  const isPaymentValid =
    selectedCompany && paymentAmount && parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) <= balance;

  if (!username) {
    return (
      <div className="flex w-screen h-screen flex-col items-center justify-center">
        <p className="text-lg text-primary">Loading...</p>
      </div>
    );
  }

  // transform companies to dropdown options
  const companyOptions = companies.map((company) => ({
    value: company.name,
    label: `${company.name} (${company.category})`,
  }));

  return (
    <div className="flex bg-gray">
      {/* Toast Notification */}
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} duration={toast.duration} />

      <Sidebar />
      <div className="w-4/5 flex h-screen flex-col items-center">
        {/* HEADER */}
        <div className="flex items-center w-full h-24 bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)]">
          <h1 className="text-primary text-4xl font-semibold mx-8">Pay Bills</h1>
        </div>

        {/* Main Card Content */}
        <div className="flex w-full pt-16 px-40 items-center justify-center">
          <div className="flex flex-col w-full bg-white shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] rounded-3xl p-12">
            {/* Company Selection */}
            <div className="mb-8">
              <p className="text-gray-mid text-2xl font-medium tracking-wide mb-4">MAKE PAYMENT TO</p>
              <CustomDropdown
                value={selectedCompany}
                onChange={setSelectedCompany}
                options={companyOptions}
                placeholder="Select a company..."
                icon={IoBusiness}
                disabled={isLoading}
              />
            </div>

            {/* Amount Input */}
            <p className="text-gray-mid text-2xl font-medium tracking-wide">ENTER AMOUNT</p>
            <div className="flex flex-row items-center justify-center gap-6 text-8xl font-semibold tracking-wide py-12">
              <h1 className="text-black">PHP</h1>
              <input
                type="text"
                value={paymentAmount}
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
                placeholder="Enter payment notes..."
                disabled={isLoading}
                className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors duration-200"
              />
            </div>

            {/* Balance Display */}
            <div className="flex flex-row items-center justify-center gap-6 text-2xl text-black font-medium tracking-wide mb-6">
              <p>ACCOUNT BALANCE:</p>
              <p className="text-primary-dark">PHP {formatCurrency(balance)}</p>
            </div>

            {/* Payment Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={handlePayBills}
                disabled={isLoading || !isPaymentValid}
                className={`px-12 py-3 rounded-xl text-xl font-semibold transition-all duration-200 ${
                  isLoading || !isPaymentValid
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-primary text-orange-50 hover:bg-primary-light hover:scale-101 cursor-pointer"
                }`}
              >
                {isLoading ? "Processing..." : "Pay Bills"}
              </button>
            </div>
          </div>
        </div>

        <p className="text-lg text-black font-medium tracking-widest mt-8">Double check payment amount before proceeding.</p>
      </div>
    </div>
  );
}