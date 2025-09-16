"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

export default function Login() {
    const [formData, setFormData] = useState({
        username: "",
        pin: "",
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({
        message: "",
        type: "info",
        isVisible: false,
    });
    const [isChecking, setIsChecking] = useState(true);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const router = useRouter();

    // Check if user is already logged in
    useEffect(() => {
        const checkAuth = () => {
            const storedUsername = localStorage.getItem("username");
            if (storedUsername) {
                router.replace("/dashboard");
                return;
            }
            setIsChecking(false);
        };

        checkAuth();
    }, [router]);

    // Track mouse position for grid animation
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Calculate color intensity for grid
    const colorIntensity = Math.min(
        (mousePosition.x + mousePosition.y) / 2000,
        1
    );
    const gridColor = `hsl(${120 + colorIntensity * 60}, 70%, ${
        50 + colorIntensity * 20
    }%)`;

    const showToast = (message, type = "info") => {
        setToast({ message, type, isVisible: true });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!formData.username || !formData.pin) {
            showToast("Please fill in all fields", "error");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    pin: formData.pin,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("username", formData.username);
                showToast("Login successful! Redirecting...", "success");
                setTimeout(() => {
                    router.replace("/dashboard");
                }, 1000);
            } else {
                showToast(data.detail || "Something went wrong", "error");
            }
        } catch (error) {
            console.error("Login error:", error);
            showToast("Failed to connect to server. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                <div className="text-primary text-lg">
                    Checking authentication...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-white">
            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `linear-gradient(${gridColor} 2px, transparent 2px), linear-gradient(90deg, ${gridColor} 2px, transparent 2px)`,
                    backgroundSize: "80px 80px",
                    transform: `translate(${mousePosition.x * 0.02}px, ${
                        mousePosition.y * 0.02
                    }px)`,
                    transition: "background-image 0.3s ease",
                }}
            />

            {/* Content */}
            <div className="relative z-10 w-full flex items-center justify-center p-4 min-h-screen">
                <div className="w-full max-w-md">
                    {/* Brand */}
                    <div className="text-center mb-8">
                        <Link
                            href="/"
                            className="text-6xl font-bold text-primary tracking-wider mb-2"
                        >
                            KNC
                        </Link>
                        <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>

                    {/* Login Form */}
                    <div className="backdrop-blur-xl bg-primary-subtle/40 border border-primary-light/20 rounded-3xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-semibold text-primary-dark text-center mb-8 tracking-wide">
                            Welcome Back
                        </h2>

                        <div className="space-y-6">
                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-medium text-primary-dark mb-2 tracking-wide">
                                    USERNAME
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-3 bg-primary-subtle/50 border border-primary-light/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary backdrop-blur-sm text-primary-dark placeholder-gray-sub transition-all duration-300"
                                    placeholder="Enter your username"
                                    autoComplete="off"
                                    disabled={loading}
                                />
                            </div>

                            {/* PIN Field */}
                            <div>
                                <label className="block text-sm font-medium text-primary-dark mb-2 tracking-wide">
                                    PIN
                                </label>
                                <input
                                    type="password"
                                    name="pin"
                                    value={formData.pin}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-3 bg-primary-subtle/50 border border-primary-light/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary backdrop-blur-sm text-primary-dark placeholder-gray-sub transition-all duration-300"
                                    placeholder="Enter your PIN"
                                    disabled={loading}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full py-3 px-6 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? "SIGNING IN..." : "SIGN IN"}
                            </button>
                        </div>

                        {/* Sign Up Link */}
                        <div className="text-center mt-6">
                            <p className="text-primary-dark">
                                New here?{" "}
                                <Link
                                    href="/auth/signup"
                                    className="text-primary hover:text-primary-light font-semibold transition-colors duration-200"
                                >
                                    Sign up here!
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() =>
                    setToast((prev) => ({ ...prev, isVisible: false }))
                }
            />
        </div>
    );
}