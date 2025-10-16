"use client"

import { useState, useEffect } from "react"
import { Phone, PhoneCall, PhoneOff, User, X, ChevronDown } from "lucide-react"
import { MdKeyboardBackspace } from "react-icons/md"
import { CiEraser } from "react-icons/ci"
import { useAuth } from "@/context/authContext"
import useCallStore from "@/stores/callStore"
import atService from "@/services/africasTalkingService"

type CallState = "idle" | "dialing" | "calling" | "in-call" | "ended"

const contacts = [
  { id: 1, name: "Andrew K.", number: "+254700900900", role: "Head of Finance" },
  { id: 2, name: "Sarah M.", number: "+254730600600", role: "Operations" },
  { id: 3, name: "David P.", number: "+254724300350", role: "Sales Lead" },
  { id: 4, name: "Emma W.", number: "+254711222333", role: "Marketing" },
  { id: 5, name: "James N.", number: "+254722333444", role: "Engineering" },
  { id: 6, name: "Lucy T.", number: "+254733444555", role: "HR" },
  { id: 7, name: "Michael B.", number: "+254744555666", role: "Product" },
  { id: 8, name: "Grace O.", number: "+254755666777", role: "Support" },
  { id: 9, name: "John R.", number: "+254766777888", role: "Design" },
  { id: 10, name: "Alice M.", number: "+254777888999", role: "Analytics" },
]

export default function CallModal() {
  const { user } = useAuth()
  const { isCallModalOpen, closeCallModal } = useCallStore()
  const [selectedContact, setSelectedContact] = useState<any | null>(null)
  const [dialNumber, setDialNumber] = useState("")
  const [callState, setCallState] = useState<CallState>("idle")
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [showContacts, setShowContacts] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [dialogContact, setDialogContact] = useState<any | null>(null)

  // Detect mobile vs desktop
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 640)
    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCallModalOpen || showContactDialog || showContacts || callState !== "idle") return
      const validKeys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "#", "+"]
      if (validKeys.includes(e.key)) {
        handleDial(e.key)
      } else if (e.key === "Backspace") {
        e.preventDefault()
        handleBackspace()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isCallModalOpen, showContactDialog, showContacts, callState])

  const handleDial = (num: string) => {
    setDialNumber((prev) => prev + num)
    setPressedKey(num)
    setTimeout(() => setPressedKey(null), 140)
  }

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1))
    setPressedKey("Backspace")
    setTimeout(() => setPressedKey(null), 140)
  }

  const handleClearAll = () => {
    setDialNumber("")
  }

  const startCall = async () => {
    if (!dialNumber || dialNumber.length < 3) {
      alert("Please enter a valid phone number")
      return
    }

    try {
      setCallState("dialing")
      
      console.log("Making call to:", dialNumber)
      
      const result = await atService.makeCall({
        to: dialNumber,
        from_: undefined
      })
      
      // Store session ID for tracking
      const sessionId = result.call_id || result.at_response?.entries?.[0]?.sessionId
      console.log("Call initiated with session ID:", sessionId)
      
      setCallState("calling")
      
      // Connect to WebSocket for real-time updates
      if (sessionId) {
        const wsUrl = `ws://localhost:8000/api/calls/stream/${sessionId}`
        console.log("Connecting to WebSocket:", wsUrl)
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log("WebSocket connected")
        }
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          console.log("Call update:", data)
          
          if (data.type === 'call_update' || data.type === 'call_status') {
            switch (data.status) {
              case 'queued':
                setCallState("calling")
                break
              case 'ringing':
                setCallState("calling")
                break
              case 'in-progress':
                setCallState("in-call")
                break
              case 'completed':
              case 'failed':
              case 'ended':
                setCallState("ended")
                setTimeout(() => {
                  setCallState("idle")
                  setDialNumber("")
                  setSelectedContact(null)
                  ws.close()
                }, 3000)
                break
            }
          }
        }
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          setCallState("ended")
          setTimeout(() => {
            setCallState("idle")
            setDialNumber("")
            setSelectedContact(null)
          }, 2000)
        }
        
        ws.onclose = () => {
          console.log("WebSocket closed")
        }
        
        // Store WebSocket reference for cleanup
        return () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
        }
      }
      
    } catch (err: any) {
      console.error("Error starting call:", err)
      alert(`Failed to start call: ${err.message}`)
      setCallState("idle")
    }
  }

  const endCall = async () => {
    setCallState("ended")
    setTimeout(() => {
      setCallState("idle")
      setDialNumber("")
      setSelectedContact(null)
      setShowContacts(false)
      setShowContactDialog(false)
    }, 1400)
  }

  const handleContactClick = (contact: any) => {
    if (isMobile) {
      setDialogContact(contact)
      setShowContactDialog(true)
    } else {
      setSelectedContact(contact)
      setDialNumber(contact.number)
    }
  }

  const handleCallContact = () => {
    if (dialogContact) {
      setSelectedContact(dialogContact)
      setDialNumber(dialogContact.number)
      setShowContactDialog(false)
      setShowContacts(false)
      startCall()
    }
  }

  if (!isCallModalOpen) return null

  return (
    <>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
        <div className="bg-gray-900 text-white rounded-2xl shadow-2xl w-[850px] h-[520px] flex overflow-hidden relative">
          {/* Close Button */}
          {callState === "idle" && (
            <button
              onClick={closeCallModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              aria-label="Close Dialer"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Contacts Panel (Desktop) */}
          {callState === "idle" && !isMobile && (
            <div className="w-1/3 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto no-scrollbar">
              <h2 className="text-lg font-semibold mb-3">Contacts</h2>
              <ul className="space-y-3">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => handleContactClick(c)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition ${
                      selectedContact?.id === c.id ? "bg-gray-700" : ""
                    }`}
                    role="button"
                    aria-label={`Select ${c.name}`}
                  >
                    <div className="bg-blue-600 w-10 h-10 flex items-center justify-center rounded-full">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contacts Overlay (Mobile) */}
          {callState === "idle" && isMobile && showContacts && (
            <div className="absolute inset-0 bg-gray-800 p-4 overflow-y-auto no-scrollbar z-20">
              <button
                onClick={() => setShowContacts(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                aria-label="Close Contacts"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold mb-3">Contacts</h2>
              <ul className="space-y-3">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => handleContactClick(c)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition ${
                      selectedContact?.id === c.id ? "bg-gray-700" : ""
                    }`}
                    role="button"
                    aria-label={`Select ${c.name}`}
                  >
                    <div className="bg-blue-600 w-10 h-10 flex items-center justify-center rounded-full">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Toggle Contacts Button (Mobile) */}
          {callState === "idle" && isMobile && !showContacts && (
            <button
              onClick={() => setShowContacts(true)}
              className="absolute top-3 left-3 text-gray-400 hover:text-white z-10"
              aria-label="Show Contacts"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          )}

          <div className={`${callState === "idle" && !isMobile ? "w-2/3" : "w-full"} flex flex-col p-6 items-center justify-center`}>
            {callState === "idle" && (
              <div className="flex flex-col items-center space-y-6 w-full">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-semibold">{dialNumber || "Enter Number"}</div>
                  {dialNumber && (
                    <>
                      <button
                        onClick={handleBackspace}
                        title="Backspace"
                        aria-label="Backspace"
                        className="ml-3 text-gray-400 hover:text-white"
                      >
                        <MdKeyboardBackspace className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleClearAll}
                        title="Clear All"
                        aria-label="Clear All"
                        className="text-gray-400 hover:text-red-400"
                      >
                        <CiEraser className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-xl">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDial(d)}
                      className={`w-16 h-16 flex items-center justify-center rounded-full transition transform ${
                        pressedKey === d
                          ? "bg-white/10 scale-95 text-white shadow-inner"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                      aria-label={`Dial ${d}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <button
                  className="bg-green-500 hover:bg-green-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  onClick={startCall}
                  aria-label="Start call"
                >
                  <PhoneCall className="w-7 h-7" />
                </button>
              </div>
            )}

            {callState === "dialing" && (
              <div className="flex flex-col items-center space-y-6">
                <User className="w-16 h-16 text-gray-400" />
                <p className="text-lg">{selectedContact?.name || dialNumber}</p>
                <p className="text-gray-400">Initiating call via Africa's Talking...</p>
                <button
                  className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center"
                  onClick={endCall}
                  aria-label="Cancel call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            )}

            {callState === "calling" && (
              <div className="flex flex-col items-center space-y-6">
                <User className="w-16 h-16 text-gray-400" />
                <p className="text-lg">{selectedContact?.name || dialNumber}</p>
                <p className="text-gray-400">Calling...</p>
                <button
                  className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center"
                  onClick={endCall}
                  aria-label="Cancel call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            )}

            {callState === "in-call" && (
              <div className="flex flex-col items-center space-y-6">
                <User className="w-16 h-16 text-gray-400" />
                <p className="text-lg">{selectedContact?.name || dialNumber}</p>
                <p className="text-green-400">Connected via Africa's Talking</p>
                <p className="text-sm text-gray-400">Call in progress...</p>
                <button
                  className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mt-6"
                  onClick={endCall}
                  aria-label="End call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            )}

            {callState === "ended" && (
              <div className="flex flex-col items-center space-y-4">
                <User className="w-16 h-16 text-gray-400" />
                <p className="text-lg">{selectedContact?.name || dialNumber}</p>
                <p className="text-red-400">Call Ended</p>
              </div>
            )}

            {showContactDialog && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-gray-800 rounded-lg p-4 w-full max-w-[90%]">
                  <h3 className="text-lg font-semibold mb-2">{dialogContact?.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{dialogContact?.number}</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowContactDialog(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                      aria-label="Cancel"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCallContact}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                      aria-label={`Call ${dialogContact?.name}`}
                    >
                      Call
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
