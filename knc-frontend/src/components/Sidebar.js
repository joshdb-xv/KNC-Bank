"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ICONS
import { MdDashboard, MdOutlineDashboard, MdHistory, MdOutlineHistory, MdSend, MdOutlineSend } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { RiUser3Fill, RiBankCardFill, RiBankCardLine } from "react-icons/ri";
import { FaMoneyBillWave, FaRegMoneyBillAlt } from "react-icons/fa";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  const navSections = [
    {
      title: "MANAGE",
      items: [
        {
          label: "DASHBOARD",
          path: "/dashboard",
          icon: { solid: MdDashboard, outline: MdOutlineDashboard },
        },
        {
          label: "PROFILE",
          path: "/profile",
          icon: { solid: RiUser3Fill, outline: CgProfile },
        },
      ],
    },
    {
      title: "SERVICES",
      items: [
        {
          label: "DEPOSIT",
          path: "/deposit",
          icon: { solid: FaMoneyBillWave, outline: FaRegMoneyBillAlt },
        },
        {
          label: "WITHDRAW",
          path: "/withdraw",
          icon: { solid: RiBankCardFill, outline: RiBankCardLine },
        },
        {
          label: "SEND MONEY",
          path: "/send-money",
          icon: { solid: MdSend, outline: MdOutlineSend },
        },
        {
          label: "PAY BILLS",
          path: "/pay-bills",
          icon: { solid: FaMoneyBillWave, outline: FaRegMoneyBillAlt },
        },
        {
          label: "HISTORY",
          path: "/history",
          icon: { solid: MdHistory, outline: MdOutlineHistory },
        },
      ],
    },
  ];

  return (
    <div className="bg-black w-1/5 h-screen shadow-[0px_2px_16px_0px_rgba(0,0,0,0.15)] z-100">
      <p className="text-primary-light text-3xl font-semibold p-8">KNC Bank</p>

      <div className="flex flex-col gap-16 mx-8">
        {navSections.map((section) => (
          <div key={section.title} className="tracking-wide">
            <p className="text-gray-light font-semibold mb-4 tracking-wider">
              {section.title}
            </p>
            <div className="flex flex-col gap-8 px-8">
              {section.items.map(({ label, path, icon }) => {
                const ActiveIcon = icon.solid;
                const InactiveIcon = icon.outline;
                const active = isActive(path);

                return (
                  <div key={path} className="flex flex-row gap-2 items-center">
                    {active ? (
                      <ActiveIcon className="text-2xl text-primary-light" />
                    ) : (
                      <InactiveIcon className="text-2xl text-white" />
                    )}
                    <Link
                      href={path}
                      className={`text-xl font-medium ${
                        active ? "text-primary-light" : "text-white"
                      }`}
                    >
                      {label}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
