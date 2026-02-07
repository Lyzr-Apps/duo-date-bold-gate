'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  FaHeart,
  FaTimes,
  FaComments,
  FaCalendarAlt,
  FaUser,
  FaPaperPlane,
  FaMapMarkerAlt,
  FaCheck,
  FaArrowRight,
  FaInfoCircle
} from 'react-icons/fa'
import { Loader2 } from 'lucide-react'

// TypeScript Interfaces based on actual agent responses
interface ProfileData {
  name: string | null
  age: number | null
  gender: string | null
  location: string | null
  occupation: string | null
  interests: string[] | null
  lookingFor: string | null
  dealBreakers: string[] | null
  idealDateType: string[] | null
  preferredGender: string[] | null
  preferredAgeMin: number | null
  preferredAgeMax: number | null
}

interface ProfileBuilderResponse {
  message: string
  profileData: ProfileData
  isComplete: boolean
  nextQuestion: string
}

interface DailyMatchDetails {
  matchedUserId: string
  matchedUserName: string
  compatibilityScore: number
  matchReason: string
  sharedInterests: string[]
  compatibilityHighlights: string[]
  suggestedFirstDate: string
  distanceInMiles: number
}

interface Match {
  id: string
  userId: string
  matchedUserId: string
  status: string
  compatibilityScore: number
  matchReason: string
  userLiked: boolean | null
  matchedUserLiked: boolean | null
  isMutualMatch: boolean
  createdAt: string
  matchedUser: {
    id: string
    name: string
    age: number
    gender: string
    location: string
    occupation: string | null
    bio: string | null
    interests: string[]
    photos: string[]
  }
}

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  createdAt: string
  sender: {
    id: string
    name: string
    photos: string[]
  }
}

export default function DoubleMate() {
  // App state
  const [currentView, setCurrentView] = useState<'onboarding' | 'main'>('onboarding')
  const [activeTab, setActiveTab] = useState<'discover' | 'matches' | 'chat' | 'profile'>('discover')

  // User state
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null)

  // Onboarding state
  const [onboardingMessages, setOnboardingMessages] = useState<Array<{role: 'user' | 'agent', content: string}>>([])
  const [onboardingInput, setOnboardingInput] = useState('')
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(7))
  const [accumulatedProfileData, setAccumulatedProfileData] = useState<ProfileData>({
    name: null,
    age: null,
    gender: null,
    location: null,
    occupation: null,
    interests: null,
    lookingFor: null,
    dealBreakers: null,
    idealDateType: null,
    preferredGender: null,
    preferredAgeMin: null,
    preferredAgeMax: null,
  })

  // Daily match state
  const [todaysMatch, setTodaysMatch] = useState<Match | null>(null)
  const [matchDetails, setMatchDetails] = useState<DailyMatchDetails | null>(null)
  const [isLoadingMatch, setIsLoadingMatch] = useState(false)
  const [hasRespondedToday, setHasRespondedToday] = useState(false)

  // Chat state
  const [mutualMatches, setMutualMatches] = useState<Match[]>([])
  const [selectedChat, setSelectedChat] = useState<Match | null>(null)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Initialize onboarding
  useEffect(() => {
    if (currentView === 'onboarding' && onboardingMessages.length === 0) {
      startOnboarding()
    }
  }, [currentView])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [onboardingMessages, chatMessages])

  const startOnboarding = async () => {
    setIsOnboardingLoading(true)
    try {
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hi', sessionId }),
      })
      const data = await response.json()

      console.log('Initial onboarding response:', data)

      if (data.success && data.response) {
        const agentResponse: ProfileBuilderResponse = data.response
        setOnboardingMessages([{ role: 'agent', content: agentResponse.message }])
      } else {
        console.error('Failed to start onboarding:', data)
        setOnboardingMessages([{
          role: 'agent',
          content: 'Hi! Welcome to DoubleMate. Let me help you create your profile. What\'s your name?'
        }])
      }
    } catch (error) {
      console.error('Failed to start onboarding:', error)
      setOnboardingMessages([{
        role: 'agent',
        content: 'Hi! Welcome to DoubleMate. Let me help you create your profile. What\'s your name?'
      }])
    } finally {
      setIsOnboardingLoading(false)
    }
  }

  const handleOnboardingSend = async () => {
    if (!onboardingInput.trim() || isOnboardingLoading) return

    const userMessage = onboardingInput.trim()
    setOnboardingMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setOnboardingInput('')
    setIsOnboardingLoading(true)

    try {
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId }),
      })
      const data = await response.json()

      console.log('Onboarding API response:', data)

      if (data.success && data.response) {
        const agentResponse: ProfileBuilderResponse = data.response
        console.log('Agent response:', agentResponse)

        setOnboardingMessages(prev => [...prev, { role: 'agent', content: agentResponse.message }])

        // Update accumulated profile data
        if (agentResponse.profileData) {
          setAccumulatedProfileData(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(agentResponse.profileData).filter(([_, v]) => v !== null)
            ),
          }))
        }

        // Check if onboarding is complete
        if (agentResponse.isComplete) {
          setTimeout(() => completeOnboarding(agentResponse.profileData), 2000)
        }
      } else {
        // Handle error response
        console.error('API error:', data)
        setOnboardingMessages(prev => [...prev, {
          role: 'agent',
          content: data.error || 'Sorry, I had trouble understanding. Could you try again?'
        }])
      }
    } catch (error) {
      console.error('Onboarding chat error:', error)
      setOnboardingMessages(prev => [...prev, { role: 'agent', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setIsOnboardingLoading(false)
    }
  }

  const completeOnboarding = async (profileData: ProfileData) => {
    try {
      // Merge accumulated data with final data
      const finalProfileData = { ...accumulatedProfileData, ...profileData }

      const email = `user_${Date.now()}@doublemate.app` // Generate temp email
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, profileData: finalProfileData }),
      })
      const data = await response.json()

      if (data.success && data.profile) {
        setUserId(data.profile.id)
        setUserEmail(email)
        setUserProfile(finalProfileData)
        setCurrentView('main')
        fetchDailyMatch(data.profile.id)
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const fetchDailyMatch = async (currentUserId: string) => {
    setIsLoadingMatch(true)
    try {
      const response = await fetch('/api/matches/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      })
      const data = await response.json()

      if (data.success && data.match) {
        setTodaysMatch(data.match)
        if (data.matchDetails) {
          setMatchDetails(data.matchDetails)
        }
        setHasRespondedToday(data.match.userLiked !== null)
      }
    } catch (error) {
      console.error('Failed to fetch daily match:', error)
    } finally {
      setIsLoadingMatch(false)
    }
  }

  const handleMatchResponse = async (liked: boolean) => {
    if (!todaysMatch || !userId) return

    try {
      const response = await fetch('/api/matches/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: todaysMatch.id, userId, liked }),
      })
      const data = await response.json()

      if (data.success) {
        setHasRespondedToday(true)
        setTodaysMatch(data.match)

        if (data.isMutualMatch) {
          setMutualMatches(prev => [...prev, data.match])
          setActiveTab('matches')
        }
      }
    } catch (error) {
      console.error('Failed to respond to match:', error)
    }
  }

  const loadChatMessages = async (match: Match) => {
    try {
      const response = await fetch(`/api/chat/messages?matchId=${match.id}`)
      const data = await response.json()

      if (data.success) {
        setChatMessages(data.messages)
        setSelectedChat(match)
        setActiveTab('chat')
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChat || !userId) return

    setIsSendingMessage(true)
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedChat.id,
          senderId: userId,
          receiverId: selectedChat.matchedUserId,
          content: chatInput.trim(),
        }),
      })
      const data = await response.json()

      if (data.success) {
        setChatMessages(prev => [...prev, data.message])
        setChatInput('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Onboarding View
  if (currentView === 'onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, hsl(350 35% 97%) 0%, hsl(340 30% 95%) 35%, hsl(330 25% 96%) 70%, hsl(355 30% 97%) 100%)'
      }}>
        <Card className="w-full max-w-2xl shadow-xl" style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '0.875rem'
        }}>
          <CardHeader className="text-center border-b" style={{ borderColor: 'hsl(350 25% 88%)' }}>
            <CardTitle className="text-3xl font-bold" style={{ color: 'hsl(346 77% 50%)' }}>
              Welcome to DoubleMate
            </CardTitle>
            <p className="text-sm mt-2" style={{ color: 'hsl(350 20% 45%)' }}>
              Let's create your dating profile through a friendly chat
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {onboardingMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[80%] px-4 py-3 rounded-lg"
                    style={{
                      background: msg.role === 'user' ? 'hsl(346 77% 50%)' : 'hsl(350 30% 96%)',
                      color: msg.role === 'user' ? 'hsl(350 30% 98%)' : 'hsl(350 30% 10%)',
                      borderRadius: '0.875rem'
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isOnboardingLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-lg" style={{ background: 'hsl(350 30% 96%)' }}>
                    <Loader2 className="animate-spin" style={{ color: 'hsl(346 77% 50%)' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                value={onboardingInput}
                onChange={(e) => setOnboardingInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleOnboardingSend()}
                placeholder="Type your answer..."
                disabled={isOnboardingLoading}
                className="flex-1"
                style={{
                  background: 'hsl(350 30% 98%)',
                  border: '1px solid hsl(350 25% 88%)',
                  borderRadius: '0.875rem',
                  color: 'hsl(350 30% 10%)'
                }}
              />
              <Button
                onClick={handleOnboardingSend}
                disabled={isOnboardingLoading || !onboardingInput.trim()}
                style={{
                  background: 'hsl(346 77% 50%)',
                  color: 'hsl(350 30% 98%)',
                  borderRadius: '0.875rem'
                }}
              >
                {isOnboardingLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <FaPaperPlane />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main App View
  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(135deg, hsl(350 35% 97%) 0%, hsl(340 30% 95%) 35%, hsl(330 25% 96%) 70%, hsl(355 30% 97%) 100%)'
    }}>
      {/* Header */}
      <header className="p-4 border-b" style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(16px)',
        borderColor: 'hsl(350 25% 88%)'
      }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(346 77% 50%)' }}>
            DoubleMate
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
              background: 'hsl(346 77% 50%)',
              color: 'hsl(350 30% 98%)'
            }}>
              <FaUser />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        {/* Discover Tab - Daily Match */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'hsl(346 77% 50%)' }}>
                Your Daily Match
              </h2>
              <p style={{ color: 'hsl(350 20% 45%)' }}>
                One carefully curated match, just for you
              </p>
            </div>

            {isLoadingMatch ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'hsl(346 77% 50%)' }} />
              </div>
            ) : todaysMatch ? (
              <Card className="max-w-2xl mx-auto shadow-xl" style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '0.875rem'
              }}>
                <CardContent className="p-8">
                  {/* Match Profile */}
                  <div className="text-center mb-6">
                    <div className="w-32 h-32 mx-auto rounded-full mb-4 flex items-center justify-center" style={{
                      background: 'linear-gradient(135deg, hsl(346 77% 50%), hsl(330 65% 45%))',
                      color: 'white',
                      fontSize: '3rem'
                    }}>
                      {todaysMatch.matchedUser.name.charAt(0)}
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'hsl(350 30% 10%)' }}>
                      {todaysMatch.matchedUser.name}, {todaysMatch.matchedUser.age}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'hsl(350 20% 45%)' }}>
                      <FaMapMarkerAlt className="w-4 h-4" />
                      <span>{todaysMatch.matchedUser.location}</span>
                    </div>
                    {todaysMatch.matchedUser.occupation && (
                      <p style={{ color: 'hsl(350 20% 45%)' }}>{todaysMatch.matchedUser.occupation}</p>
                    )}
                  </div>

                  {/* Compatibility Score */}
                  <div className="text-center mb-6 p-4 rounded-lg" style={{ background: 'hsl(350 30% 96%)' }}>
                    <div className="text-4xl font-bold mb-1" style={{ color: 'hsl(346 77% 50%)' }}>
                      {Math.round(todaysMatch.compatibilityScore * 10)}%
                    </div>
                    <div className="text-sm" style={{ color: 'hsl(350 20% 45%)' }}>Compatibility Score</div>
                  </div>

                  {/* Why This Match */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'hsl(350 30% 10%)' }}>
                      <FaInfoCircle style={{ color: 'hsl(346 77% 50%)' }} />
                      Why This Match?
                    </h4>
                    <p style={{ color: 'hsl(350 20% 45%)' }}>{todaysMatch.matchReason}</p>
                  </div>

                  {/* Shared Interests */}
                  {todaysMatch.matchedUser.interests.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2" style={{ color: 'hsl(350 30% 10%)' }}>
                        Interests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {todaysMatch.matchedUser.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{
                              background: 'hsl(350 25% 92%)',
                              color: 'hsl(350 30% 15%)'
                            }}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!hasRespondedToday ? (
                    <div className="flex gap-4 justify-center mt-8">
                      <Button
                        onClick={() => handleMatchResponse(false)}
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{
                          background: 'hsl(350 25% 92%)',
                          color: 'hsl(0 84% 60%)',
                          border: 'none'
                        }}
                      >
                        <FaTimes className="w-8 h-8" />
                      </Button>
                      <Button
                        onClick={() => handleMatchResponse(true)}
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{
                          background: 'hsl(346 77% 50%)',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <FaHeart className="w-8 h-8" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center mt-8 p-4 rounded-lg" style={{
                      background: 'hsl(350 25% 92%)',
                      color: 'hsl(350 30% 15%)'
                    }}>
                      <FaCheck className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(346 77% 50%)' }} />
                      <p className="font-semibold">
                        {todaysMatch.userLiked
                          ? "You liked this match! We'll let you know if they like you back."
                          : "Thanks for your response. Check back tomorrow for a new match!"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl" style={{ color: 'hsl(350 20% 45%)' }}>
                  No matches available right now. Check back tomorrow!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'hsl(346 77% 50%)' }}>
              Mutual Matches
            </h2>
            {mutualMatches.length === 0 ? (
              <div className="text-center py-20">
                <FaHeart className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(350 25% 88%)' }} />
                <p className="text-xl" style={{ color: 'hsl(350 20% 45%)' }}>
                  No mutual matches yet. Keep swiping!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {mutualMatches.map((match) => (
                  <Card
                    key={match.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => loadChatMessages(match)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.75)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: '0.875rem'
                    }}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, hsl(346 77% 50%), hsl(330 65% 45%))',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}>
                        {match.matchedUser.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold" style={{ color: 'hsl(350 30% 10%)' }}>
                          {match.matchedUser.name}, {match.matchedUser.age}
                        </h3>
                        <p className="text-sm" style={{ color: 'hsl(350 20% 45%)' }}>
                          {match.matchedUser.location}
                        </p>
                      </div>
                      <FaArrowRight style={{ color: 'hsl(346 77% 50%)' }} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div>
            {!selectedChat ? (
              <div className="text-center py-20">
                <FaComments className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(350 25% 88%)' }} />
                <p className="text-xl" style={{ color: 'hsl(350 20% 45%)' }}>
                  Select a match to start chatting
                </p>
              </div>
            ) : (
              <Card className="shadow-xl" style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '0.875rem'
              }}>
                <CardHeader className="border-b" style={{ borderColor: 'hsl(350 25% 88%)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                      background: 'linear-gradient(135deg, hsl(346 77% 50%), hsl(330 65% 45%))',
                      color: 'white'
                    }}>
                      {selectedChat.matchedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'hsl(350 30% 10%)' }}>
                        {selectedChat.matchedUser.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'hsl(350 20% 45%)' }}>
                        {selectedChat.matchedUser.location}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'hsl(350 20% 45%)' }}>
                        Start the conversation!
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[70%] px-4 py-3 rounded-lg"
                            style={{
                              background: msg.senderId === userId ? 'hsl(346 77% 50%)' : 'hsl(350 30% 96%)',
                              color: msg.senderId === userId ? 'hsl(350 30% 98%)' : 'hsl(350 30% 10%)',
                              borderRadius: '0.875rem'
                            }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type a message..."
                      disabled={isSendingMessage}
                      className="flex-1"
                      style={{
                        background: 'hsl(350 30% 98%)',
                        border: '1px solid hsl(350 25% 88%)',
                        borderRadius: '0.875rem',
                        color: 'hsl(350 30% 10%)'
                      }}
                    />
                    <Button
                      onClick={sendChatMessage}
                      disabled={isSendingMessage || !chatInput.trim()}
                      style={{
                        background: 'hsl(346 77% 50%)',
                        color: 'hsl(350 30% 98%)',
                        borderRadius: '0.875rem'
                      }}
                    >
                      {isSendingMessage ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <FaPaperPlane />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'hsl(346 77% 50%)' }}>
              Your Profile
            </h2>
            <Card className="max-w-2xl mx-auto shadow-xl" style={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '0.875rem'
            }}>
              <CardContent className="p-6 space-y-4">
                {userProfile && (
                  <>
                    <div>
                      <label className="font-semibold" style={{ color: 'hsl(350 30% 10%)' }}>Name</label>
                      <p style={{ color: 'hsl(350 20% 45%)' }}>{userProfile.name}</p>
                    </div>
                    <div>
                      <label className="font-semibold" style={{ color: 'hsl(350 30% 10%)' }}>Age</label>
                      <p style={{ color: 'hsl(350 20% 45%)' }}>{userProfile.age}</p>
                    </div>
                    <div>
                      <label className="font-semibold" style={{ color: 'hsl(350 30% 10%)' }}>Location</label>
                      <p style={{ color: 'hsl(350 20% 45%)' }}>{userProfile.location}</p>
                    </div>
                    {userProfile.occupation && (
                      <div>
                        <label className="font-semibold" style={{ color: 'hsl(350 30% 10%)' }}>Occupation</label>
                        <p style={{ color: 'hsl(350 20% 45%)' }}>{userProfile.occupation}</p>
                      </div>
                    )}
                    {userProfile.interests && userProfile.interests.length > 0 && (
                      <div>
                        <label className="font-semibold mb-2 block" style={{ color: 'hsl(350 30% 10%)' }}>Interests</label>
                        <div className="flex flex-wrap gap-2">
                          {userProfile.interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full text-sm"
                              style={{
                                background: 'hsl(350 25% 92%)',
                                color: 'hsl(350 30% 15%)'
                              }}
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {userProfile.lookingFor && (
                      <div>
                        <label className="font-semibold" style={{ color: 'hsl(350 30% 10%)' }}>Looking For</label>
                        <p style={{ color: 'hsl(350 20% 45%)' }}>{userProfile.lookingFor}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t" style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(16px)',
        borderColor: 'hsl(350 25% 88%)'
      }}>
        <div className="max-w-6xl mx-auto flex justify-around items-center py-3">
          <button
            onClick={() => setActiveTab('discover')}
            className="flex flex-col items-center gap-1 px-4 py-2"
            style={{
              color: activeTab === 'discover' ? 'hsl(346 77% 50%)' : 'hsl(350 20% 45%)'
            }}
          >
            <FaCalendarAlt className="w-6 h-6" />
            <span className="text-xs">Discover</span>
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className="flex flex-col items-center gap-1 px-4 py-2"
            style={{
              color: activeTab === 'matches' ? 'hsl(346 77% 50%)' : 'hsl(350 20% 45%)'
            }}
          >
            <FaHeart className="w-6 h-6" />
            <span className="text-xs">Matches</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className="flex flex-col items-center gap-1 px-4 py-2"
            style={{
              color: activeTab === 'chat' ? 'hsl(346 77% 50%)' : 'hsl(350 20% 45%)'
            }}
          >
            <FaComments className="w-6 h-6" />
            <span className="text-xs">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-center gap-1 px-4 py-2"
            style={{
              color: activeTab === 'profile' ? 'hsl(346 77% 50%)' : 'hsl(350 20% 45%)'
            }}
          >
            <FaUser className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
