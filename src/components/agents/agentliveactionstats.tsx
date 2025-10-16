import { TfiHeadphoneAlt } from "react-icons/tfi"
import { BsFillPhoneVibrateFill } from "react-icons/bs"
import { MdSupportAgent } from "react-icons/md"
import { ImPhoneHangUp } from "react-icons/im"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export function AgentLiveActionStats() {
    const { stats, loading, error } = useDashboardStats();

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-5 mb-4 gap-4">
                <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                    <div className="flex items-center justify-center gap-2">
                        <TfiHeadphoneAlt className="w-6 h-6 text-green-400" />
                        <span className="text-2xl lg:text-3xl font-bold">-</span>
                    </div>
                    <span className="text-slate-400">TOTAL TALKING AGENTS</span>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                    <div className="flex items-center gap-2">
                        <BsFillPhoneVibrateFill className="w-6 h-6 text-blue-400" />
                        <span className="text-2xl lg:text-3xl font-bold">-</span>
                    </div>
                    <span className="text-slate-400">CALLING</span>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                    <div className="flex items-center gap-2">
                        <ImPhoneHangUp className="w-6 h-6 text-green-400" />
                        <span className="text-2xl lg:text-3xl font-bold">-</span>
                    </div>
                    <span className="text-slate-400">AVAILABLE AGENTS</span>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                    <div className="flex items-center gap-2">
                        <MdSupportAgent className="w-6 h-6 text-yellow-400" />
                        <span className="text-2xl lg:text-3xl font-bold">-</span>
                    </div>
                    <span className="text-slate-400">BUSY AGENTS</span>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                    <div className="flex items-center gap-2">
                        <MdSupportAgent className="w-6 h-6 text-red-400" />
                        <span className="text-2xl lg:text-3xl font-bold">-</span>
                    </div>
                    <span className="text-slate-400">AWAY AGENTS</span>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center text-red-500 py-4">
                Error loading agent stats
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 mb-4 gap-4">
            <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                <div className="flex items-center justify-center gap-2">
                    <TfiHeadphoneAlt className="w-6 h-6 text-green-400" />
                    <span className="text-2xl lg:text-3xl font-bold">{stats.talkingAgents}</span>
                </div>
                <span className="text-slate-400">TOTAL TALKING AGENTS</span>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                <div className="flex items-center gap-2">
                    <BsFillPhoneVibrateFill className="w-6 h-6 text-blue-400" />
                    <span className="text-2xl lg:text-3xl font-bold">{stats.callingAgents}</span>
                </div>
                <span className="text-slate-400">CALLING</span>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                <div className="flex items-center gap-2">
                    <ImPhoneHangUp className="w-6 h-6 text-green-400" />
                    <span className="text-2xl lg:text-3xl font-bold">{stats.availableAgents}</span>
                </div>
                <span className="text-slate-400">AVAILABLE AGENTS</span>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                <div className="flex items-center gap-2">
                    <MdSupportAgent className="w-6 h-6 text-yellow-400" />
                    <span className="text-2xl lg:text-3xl font-bold">{stats.busyAgents}</span>
                </div>
                <span className="text-slate-400">BUSY AGENTS</span>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-800 px-2 py-2 text-white md:mt-3">
                <div className="flex items-center gap-2">
                    <MdSupportAgent className="w-6 h-6 text-red-400" />
                    <span className="text-2xl lg:text-3xl font-bold">{stats.awayAgents}</span>
                </div>
                <span className="text-slate-400">AWAY AGENTS</span>
            </div>
        </div>
    )
}
